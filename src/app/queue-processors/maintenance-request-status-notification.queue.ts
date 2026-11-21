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
export class MaintenanceRequestStatusNotificationQueueProcessor implements QueueProcessor<MaintenanceRequest> {
    constructor(
        @Inject(InjectionToken.container) private container: LazyDIContainer,
        private maintenanceRequestDao: MaintenanceRequestDao,
        private notificationDao: NotificationDao,
        private mailSender: MailSender,
        private templateEngine: TemplateEngine,
    ) {}

    async fetchItems(maxResults: number, skip?: MaintenanceRequest[]): Promise<MaintenanceRequest[]> {
        const skipIds = new Set(skip?.map((it) => `${it.id}:${it.status}`));
        const requests = await this.maintenanceRequestDao.getRecentlyStatusChanged(
            dayjs().subtract(2, 'day').toDate(),
        );
        const pending: MaintenanceRequest[] = [];
        for (const request of requests) {
            if (skipIds.has(`${request.id}:${request.status}`) || pending.length >= maxResults) continue;
            const existing = await this.notificationDao.findNotificationBySource({
                type: NotificationType.MAINTENANCE_REQUEST_STATUS_CHANGED,
                sourceReference: `${request.id}:${request.status}`,
            });
            if (!existing) pending.push(request);
        }
        return pending;
    }

    async processItem(request: MaintenanceRequest): Promise<void> {
        const container = this.container.clone([]);
        const activityLog: ActivityLog = createActivity('MAINTENANCE REQUEST STATUS NOTIFICATION', container);
        try {
            const service = container.getInstance(MaintenanceRequestNotificationService);
            const { created, unit } = await service.notifyResidentOfStatusChange(request);

            if (created) {
                try {
                    const emailData = await service.prepareManagerEmailData(request, unit);
                    if (emailData) {
                        await this.mailSender.sendMail({
                            to: emailData.managerEmail,
                            subject: 'Maintenance Request Status Update',
                            html: await this.templateEngine.compile(
                                'maintenance-request-status-changed.html',
                                emailData,
                            ),
                        });
                    }
                } catch (error) {
                    console.error(`Failed to send maintenance request status email for request ${request.id}`, error);
                }

                try {
                    const tenantEmailData = await service.prepareTenantEmailData(request, unit);
                    if (tenantEmailData) {
                        await this.mailSender.sendMail({
                            to: tenantEmailData.tenantEmail,
                            subject: `Your Maintenance Request is ${tenantEmailData.statusLabel}`,
                            html: await this.templateEngine.compile(
                                'maintenance-request-status-for-tenant.html',
                                tenantEmailData,
                            ),
                        });
                    }
                } catch (error) {
                    console.error(`Failed to send tenant maintenance status email for request ${request.id}`, error);
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
            const latestKey = 'maintenance-request-status-notification:latest';
            await redisClient.set(latestKey, now);
            await lockService.execute(
                'maintenance-request-status-notification:active',
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
