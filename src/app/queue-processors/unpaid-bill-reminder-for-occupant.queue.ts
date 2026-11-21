import { DIContainerModule, Inject, Injectable, InjectionToken, LazyDIContainer } from '@matchmakerjs/di';
import { QueueEngine, QueueProcessor } from '@matchmakerjs/matchmaker-cron';
import { RedisLockService } from '@matchmakerjs/matchmaker-redis';
import { ActivityLog, ActivityStatus, createActivity, finishActivity } from '@matchmakerjs/typeorm-audit';
import { RedisClientType } from '@redis/client';
import dayjs from 'dayjs';
import { EntityManager } from 'typeorm';
import { TemplateEngine } from '../../utils/template-engine';
import { PropertyUnitOccupantDao } from '../dao/property-unit-occupant.dao';
import { TenureLedgerDao } from '../dao/tenure-ledger.dao';
import {
    PropertyUnitOccupant,
    _PropertyUnitOccupant,
} from '../data/entities/external/tenure/property-unit-occupant.entity';
import { MailSender } from '../integrations/email/mail-sender';
import { PropertyEnrichmentService } from '../services/property-enrichment.service';
import { UnpaidBillNotificationService } from '../services/unpaid-bill-notification.service';

@Injectable()
export class UnpaidBillReminderForOccupantQueueProcessor implements QueueProcessor<PropertyUnitOccupant> {
    constructor(
        @Inject(InjectionToken.container) private container: LazyDIContainer,
        private entityManager: EntityManager,
        private propertyUnitOccupantDao: PropertyUnitOccupantDao,
        private tenureLedgerDao: TenureLedgerDao,
        private propertyService: PropertyEnrichmentService,
        private unpaidBillNotificationService: UnpaidBillNotificationService,
        private mailSender: MailSender,
        private templateEngine: TemplateEngine,
    ) {}

    async fetchItems(maxResults: number, skip?: PropertyUnitOccupant[]): Promise<PropertyUnitOccupant[]> {
        const now = new Date();
        // Repeats every 2 days for as long as the occupant remains in `getDefaultingOccupantsToNotify`
        // (i.e. still has an outstanding balance) — it stops on its own once the bill is cleared.
        const occupants = await this.propertyUnitOccupantDao.getDefaultingOccupantsToNotify(now, maxResults, {
            skip,
            lastNotifiedBefore: dayjs(now).subtract(2, 'day').startOf('day').toDate(),
        });
        const tenures = occupants.map((it) => it.tenure);
        await this.propertyService.loadForUnits(tenures.map((it) => it.propertyUnit));
        const ledgers = await this.tenureLedgerDao.getOutstandingByTenures(tenures, now);
        tenures.forEach((tenure) => (tenure.defaultingLedgers = ledgers.filter((it) => it.tenure.id === tenure.id)));
        return occupants;
    }

    async processItem(occupant: PropertyUnitOccupant): Promise<void> {
        const container = this.container.clone([]);
        const activityLog: ActivityLog = createActivity('UNPAID BILL REMINDER FOR OCCUPANT', container);
        try {
            const tenure = occupant.tenure;
            if (!tenure.defaultingLedgers?.length) {
                throw new Error(`Defaulting ledgers missing for defaulting occupant ${tenure.id}`);
            }

            const emailData = await this.unpaidBillNotificationService.prepareMailData(
                occupant,
                tenure.defaultingLedgers,
            );

            if (!emailData) {
                throw new Error(`Unable to resolve email data found for occupant ${occupant.id}`);
            }

            // Created before the email so a failed send retries without duplicating it; a failure
            // here must not stop the email, which is the primary channel.
            try {
                await container
                    .getInstance(UnpaidBillNotificationService)
                    .createOverdueBillNotification(occupant, emailData, new Date());
            } catch (error) {
                console.error(`Failed to create in-app overdue bill notification for occupant ${occupant.id}`, error);
            }

            // Best-effort: prepareInvoiceAttachment never throws, so a PDF-fetch problem never
            // blocks the email itself.
            const attachment = await this.unpaidBillNotificationService.prepareInvoiceAttachment(
                emailData.workspaceId,
                tenure.id,
            );

            await this.mailSender.sendMail({
                to: occupant.user.emailAddress,
                subject: 'Unpaid Bill Reminder',
                html: await this.templateEngine.compile('unpaid-bill-for-occupant.html', emailData),
                attachments: attachment ? [attachment] : undefined,
            });

            // const occupantsWithVerifiedPhoneNumber = occupants.filter((it) => it.user);
            // ToDo: send sms to occupants

            await this.entityManager
                .createQueryBuilder(_PropertyUnitOccupant, 'e')
                .update()
                .where('id = :id', { id: occupant.id })
                .set({
                    lastUnpaidBillNotificationAt: new Date(),
                })
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
            const latestKey = 'unpaid-bill-reminder-for-occupant:latest';
            await redisClient.set(latestKey, now);
            await lockService.execute(
                'unpaid-bill-reminder-for-occupant:active',
                async () => {
                    const canContinue = async () =>
                        (await containerModule.isHealthy()) && (await redisClient.get(latestKey)) === now.toString();
                    if (!(await canContinue())) return;
                    await QueueEngine.processQueue(this, canContinue, 10);
                },
                {
                    secondsTillExpiry: 300,
                },
            );
        };
    }
}
