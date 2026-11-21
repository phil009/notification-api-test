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
import { OverdueRentNotificationService } from '../services/overdue-rent-notification.service';

@Injectable()
export class OverdueRentReminderForManagerQueueProcessor implements QueueProcessor<PropertyUnitOccupant> {
    constructor(
        @Inject(InjectionToken.container) private container: LazyDIContainer,
        private entityManager: EntityManager,
        private propertyUnitOccupantDao: PropertyUnitOccupantDao,
        private tenureLedgerDao: TenureLedgerDao,
        private propertyService: PropertyEnrichmentService,
        private overdueRentNotificationService: OverdueRentNotificationService,
        private mailSender: MailSender,
        private templateEngine: TemplateEngine,
    ) {}

    async fetchItems(maxResults: number, skip?: PropertyUnitOccupant[]): Promise<PropertyUnitOccupant[]> {
        const now = new Date();
        const occupants = await this.propertyUnitOccupantDao.getDefaultingOccupantsForManagerToNotify(now, maxResults, {
            skip,
            lastNotifiedBefore: dayjs(now).startOf('month').toDate(),
        });
        const tenures = occupants.map((it) => it.tenure);
        await this.propertyService.loadForUnits(tenures.map((it) => it.propertyUnit));
        const ledgers = await this.tenureLedgerDao.getOutstandingByTenures(tenures, now);
        tenures.forEach((tenure) => (tenure.defaultingLedgers = ledgers.filter((it) => it.tenure.id === tenure.id)));
        return occupants;
    }

    async processItem(occupant: PropertyUnitOccupant): Promise<void> {
        const container = this.container.clone([]);
        const activityLog: ActivityLog = createActivity('OVERDUE RENT REMINDER FOR MANAGER', container);
        try {
            const tenure = occupant.tenure;
            if (!tenure.defaultingLedgers?.length) {
                throw new Error(`Defaulting ledgers missing for defaulting occupant ${tenure.id}`);
            }

            const emailData = await this.overdueRentNotificationService.prepareMailData(
                occupant,
                tenure.defaultingLedgers,
            );

            if (!emailData) {
                throw new Error(`Unable to resolve email data for occupant ${occupant.id}`);
            }

            const workspaceData = await this.overdueRentNotificationService.getWorkspaceData(
                tenure.propertyUnit.location,
            );
            const managerEmail = this.overdueRentNotificationService.getWorkspaceEmailAddress(workspaceData);

            if (!managerEmail) {
                throw new Error(`No manager email found for occupant ${occupant.id}`);
            }

            await this.mailSender.sendMail({
                to: managerEmail,
                subject: 'Overdue Rent Bill Alert',
                html: await this.templateEngine.compile('overdue-rent-alert.html', emailData),
            });

            await this.entityManager
                .createQueryBuilder(_PropertyUnitOccupant, 'e')
                .update()
                .where('id = :id', { id: occupant.id })
                .set({ lastManagerNotificationAt: new Date() })
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
            const latestKey = 'overdue-rent-reminder-for-manager:latest';
            await redisClient.set(latestKey, now);
            await lockService.execute(
                'overdue-rent-reminder-for-manager:active',
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
