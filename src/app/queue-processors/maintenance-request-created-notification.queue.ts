import { DIContainerModule, Inject, Injectable, InjectionToken, LazyDIContainer } from '@matchmakerjs/di';
import { QueueEngine, QueueProcessor } from '@matchmakerjs/matchmaker-cron';
import { RedisLockService } from '@matchmakerjs/matchmaker-redis';
import { ActivityLog, ActivityStatus, createActivity, finishActivity } from '@matchmakerjs/typeorm-audit';
import { RedisClientType } from '@redis/client';
import dayjs from 'dayjs';
import { EntityManager } from 'typeorm';
import { TemplateEngine } from '../../utils/template-engine';
import { MaintenanceRequest, MaintenanceRequestDao } from '../dao/maintenance-request.dao';
import { NotificationDao } from '../dao/notification.dao';
import { NotificationType } from '../data/enums/notification-type.enum';
import { MailSender } from '../integrations/email/mail-sender';
import { MaintenanceRequestNotificationService } from '../services/maintenance-request-notification.service';

@Injectable()
export class MaintenanceRequestCreatedNotificationQueueProcessor implements QueueProcessor<MaintenanceRequest> {
    constructor(
        @Inject(InjectionToken.container) private container: LazyDIContainer,
        private maintenanceRequestDao: MaintenanceRequestDao,
        private notificationDao: NotificationDao,
        private mailSender: MailSender,
        private templateEngine: TemplateEngine,
    ) {}

    async fetchItems(maxResults: number, skip?: MaintenanceRequest[]): Promise<MaintenanceRequest[]> {
        const skipIds = new Set(skip?.map((it) => it.id));
        const requests = await this.maintenanceRequestDao.getRecentlyCreated(dayjs().subtract(2, 'day').toDate());
        const pending: MaintenanceRequest[] = [];
        for (const request of requests) {
            if (skipIds.has(request.id) || pending.length >= maxResults) continue;
            const existing = await this.notificationDao.findNotificationBySource({
                type: NotificationType.MAINTENANCE_REQUEST_CREATED,
                sourceReference: request.id,
            });
            if (!existing) pending.push(request);
        }
        return pending;
    }

    async processItem(request: MaintenanceRequest): Promise<void> {
        const container = this.container.clone([]);
        const activityLog: ActivityLog = createActivity('MAINTENANCE REQUEST CREATED NOTIFICATION', container);
        try {
            const service = container.getInstance(MaintenanceRequestNotificationService);
            const { created, unit } = await service.notifyManagersOfNewRequest(request);

            if (created) {
                try {
                    const emailData = await service.prepareManagerEmailData(request, unit);
                    if (emailData) {
                        await this.mailSender.sendMail({
                            to: emailData.managerEmail,
                            subject: 'New Maintenance Request',
                            html: await this.templateEngine.compile('maintenance-request-created.html', emailData),
                        });
                    }
                } catch (error) {
                    console.error(`Failed to send maintenance request email for request ${request.id}`, error);
                }
            }
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
            const latestKey = 'maintenance-request-created-notification:latest';
            await redisClient.set(latestKey, now);
            await lockService.execute(
                'maintenance-request-created-notification:active',
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
