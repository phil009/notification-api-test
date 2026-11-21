import { DIContainerModule, Inject, Injectable, InjectionToken, LazyDIContainer } from '@matchmakerjs/di';
import { QueueEngine, QueueProcessor } from '@matchmakerjs/matchmaker-cron';
import { RedisLockService } from '@matchmakerjs/matchmaker-redis';
import { ActivityLog, ActivityStatus, createActivity, finishActivity } from '@matchmakerjs/typeorm-audit';
import { RedisClientType } from '@redis/client';
import dayjs from 'dayjs';
import { EntityManager } from 'typeorm';
import { TemplateEngine } from '../../utils/template-engine';
import { PropertyUnitOccupantDao } from '../dao/property-unit-occupant.dao';
import {
    PropertyUnitOccupant,
    _PropertyUnitOccupant,
} from '../data/entities/external/tenure/property-unit-occupant.entity';
import { MailSender } from '../integrations/email/mail-sender';
import { TwilioClient } from '../integrations/twilio/twilio-client';
import { PropertyEnrichmentService } from '../services/property-enrichment.service';
import { RentDueReminderNotificationService } from '../services/rent-due-reminder-notification.service';

@Injectable()
export class RentDueReminderForOccupantQueueProcessor implements QueueProcessor<PropertyUnitOccupant> {
    constructor(
        @Inject(InjectionToken.container) private container: LazyDIContainer,
        private entityManager: EntityManager,
        private propertyUnitOccupantDao: PropertyUnitOccupantDao,
        private propertyService: PropertyEnrichmentService,
        private rentDueReminderNotificationService: RentDueReminderNotificationService,
        private mailSender: MailSender,
        private templateEngine: TemplateEngine,
        private twilioClient: TwilioClient,
    ) {}

    async fetchItems(maxResults: number, skip?: PropertyUnitOccupant[]): Promise<PropertyUnitOccupant[]> {
        const now = new Date();
        const occupants = await this.propertyUnitOccupantDao.getOccupantsForRentDueReminder(now, maxResults, {
            skip,
            lastNotifiedBefore: dayjs(now).startOf('day').toDate(),
        });
        await this.propertyService.loadForUnits(occupants.map((it) => it.tenure.propertyUnit));
        return occupants;
    }

    async processItem(occupant: PropertyUnitOccupant): Promise<void> {
        const container = this.container.clone([]);
        const activityLog: ActivityLog = createActivity('RENT DUE REMINDER FOR OCCUPANT', container);
        try {
            if (!occupant.user?.emailAddress) {
                throw new Error(`No tenant email found for occupant ${occupant.id}`);
            }

            const emailData = this.rentDueReminderNotificationService.prepareMailData(occupant);

            // Created before the email/SMS so a failed send retries without duplicating it; a
            // failure here must not stop the email, which is the primary channel.
            try {
                await container
                    .getInstance(RentDueReminderNotificationService)
                    .createInAppNotification(occupant, emailData.daysLeft);
            } catch (error) {
                console.error(`Failed to create in-app rent due notification for occupant ${occupant.id}`, error);
            }

            await this.mailSender.sendMail({
                to: occupant.user.emailAddress,
                subject: 'Rent Due Reminder',
                html: await this.templateEngine.compile('rent-due-reminder-for-occupant.html', emailData),
            });

            if (occupant.phoneNumber) {
                try {
                    await this.twilioClient.sendSms({
                        to: occupant.phoneNumber,
                        message: this.rentDueReminderNotificationService.prepareSmsMessage(
                            occupant,
                            emailData.daysLeft,
                        ),
                    });
                } catch (error) {
                    console.error(`Failed to send rent due reminder SMS for occupant ${occupant.id}`, error);
                }
            }

            await this.entityManager
                .createQueryBuilder(_PropertyUnitOccupant, 'e')
                .update()
                .where('id = :id', { id: occupant.id })
                .set({ lastRentDueReminderAt: new Date() })
                .callListeners(false)
                .execute();
        } catch (error) {
            activityLog.status = ActivityStatus.FAILED;
            console.error(error);
            throw error;
        } finally {
            await finishActivity(activityLog, container.get(EntityManager));
        }
    }

    createTask(redisClient: RedisClientType, lockService: RedisLockService, containerModule: DIContainerModule) {
        return async () => {
            const now = Date.now();
            const latestKey = 'rent-due-reminder-for-occupant:latest';
            await redisClient.set(latestKey, now);
            await lockService.execute(
                'rent-due-reminder-for-occupant:active',
                async () => {
                    const canContinue = async () =>
                        (await containerModule.isHealthy()) && (await redisClient.get(latestKey)) === now.toString();
                    if (!(await canContinue())) return;
                    await QueueEngine.processQueue(this, canContinue, 10);
                },
                { secondsTillExpiry: 300 },
            );
        };
    }
}
