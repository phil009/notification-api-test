import { DIContainerModule, Inject, Injectable, InjectionToken, LazyDIContainer } from '@matchmakerjs/di';
import { QueueEngine, QueueProcessor } from '@matchmakerjs/matchmaker-cron';
import { RedisLockService } from '@matchmakerjs/matchmaker-redis';
import { ActivityLog, ActivityStatus, createActivity, finishActivity } from '@matchmakerjs/typeorm-audit';
import { RedisClientType } from '@redis/client';
import dayjs from 'dayjs';
import { EntityManager } from 'typeorm';
import { TemplateEngine } from '../../utils/template-engine';
import { PropertyUnitOccupantDao } from '../dao/property-unit-occupant.dao';
import { PropertyUnitTenureDao } from '../dao/property-unit-tenure.dao';
import { OccupantApiResponseTypeEnum } from '../../sdk/occupant-api-sdk';
import { _PropertyUnitTenure, PropertyUnitTenure } from '../data/entities/external/tenure/property-unit-tenure.entity';
import { MailSender } from '../integrations/email/mail-sender';
import { PropertyEnrichmentService } from '../services/property-enrichment.service';
import { RentExpiryNotificationService } from '../services/rent-expiry-notification.service';

@Injectable()
export class RentExpiryReminderForManagerQueueProcessor implements QueueProcessor<PropertyUnitTenure> {
    constructor(
        @Inject(InjectionToken.container) private container: LazyDIContainer,
        private entityManager: EntityManager,
        private propertyUnitTenureDao: PropertyUnitTenureDao,
        private propertyUnitOccupantDao: PropertyUnitOccupantDao,
        private propertyService: PropertyEnrichmentService,
        private rentExpiryNotificationService: RentExpiryNotificationService,
        private mailSender: MailSender,
        private templateEngine: TemplateEngine,
    ) {}

    async fetchItems(maxResults: number, skip?: PropertyUnitTenure[]): Promise<PropertyUnitTenure[]> {
        const now = new Date();
        const tenures = await this.propertyUnitTenureDao.getExpiringTenuresToNotify(now, maxResults, {
            skip,
            lastNotifiedBefore: dayjs(now).startOf('month').toDate(),
        });
        await this.propertyService.loadForUnits(tenures.map((it) => it.propertyUnit));
        return tenures;
    }

    async processItem(tenure: PropertyUnitTenure): Promise<void> {
        const container = this.container.clone([]);
        const activityLog: ActivityLog = createActivity('RENT EXPIRY REMINDER FOR MANAGER', container);
        try {
            const occupants = await this.propertyUnitOccupantDao.getByTenureAndType([tenure], [
                OccupantApiResponseTypeEnum.Primary,
            ]);
            const primaryOccupant = occupants[0];

            const emailData = await this.rentExpiryNotificationService.prepareMailData(tenure, primaryOccupant);

            if (!emailData) {
                throw new Error(`Unable to resolve email data for tenure ${tenure.id}`);
            }

            const managerEmail = this.rentExpiryNotificationService.getWorkspaceEmailAddress(
                await this.rentExpiryNotificationService.getWorkspaceData(tenure.propertyUnit.location),
            );

            if (!managerEmail) {
                throw new Error(`No manager email found for tenure ${tenure.id}`);
            }

            await this.mailSender.sendMail({
                to: managerEmail,
                subject: 'Unit Expiration Notice',
                html: await this.templateEngine.compile('rent-expiry-notice.html', emailData),
            });

            await this.entityManager
                .createQueryBuilder(_PropertyUnitTenure, 'e')
                .update()
                .where('id = :id', { id: tenure.id })
                .set({ lastExpiryNotificationAt: new Date() })
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
            const latestKey = 'rent-expiry-reminder-for-manager:latest';
            await redisClient.set(latestKey, now);
            await lockService.execute(
                'rent-expiry-reminder-for-manager:active',
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
