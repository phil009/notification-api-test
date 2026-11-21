import { Injectable } from '@matchmakerjs/di';
import { RedisLockService } from '@matchmakerjs/matchmaker-redis';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { NotificationRecipientDao } from '../dao/notification-recipient.dao';
import { AppSession } from '../data/entities/app-session.entity';
import { NotificationRecipient } from '../data/entities/notification-recipient.entity';
import { Notification } from '../data/entities/notification.entity';

@Injectable()
export class NotificationRecipientService {
    constructor(
        private entityManager: EntityManager,
        private notificationRecipientDao: NotificationRecipientDao,
        private redisLockService: RedisLockService,
    ) {}

    @Transactional()
    async getOrCreateNotificationRecipient(notification: Notification, userId: string): Promise<NotificationRecipient> {
        const resolveExisting = () =>
            this.entityManager
                .createQueryBuilder(NotificationRecipient, 'q')
                .where('q.userId = :userId', { userId: userId })
                .andWhere('q.notification.id =:id', { id: notification.id })
                .getOne();

        const entity = await resolveExisting();
        if (entity) return entity;

        return this.redisLockService.execute(`notifications/${notification.id}/recipients/${userId}`, async () => {
            const existing = await resolveExisting();
            if (existing) return existing;
            const entity = new NotificationRecipient();
            entity.notification = notification;
            entity.userId = userId;
            entity.viewCount = 0;
            return this.entityManager.save(entity);
        });
    }

    @Transactional()
    async registerViewedNotification(recipient: NotificationRecipient): Promise<void> {
        return this.redisLockService.execute(`notification-recipients/${recipient.id}`, async () => {
            const entity = await this.notificationRecipientDao.getById(recipient.id);
            entity.viewCount = entity.viewCount + 1;
            entity.lastViewedAt = new Date();
            if (!entity.firstViewedAt) {
                entity.firstViewedAt = entity.lastViewedAt;
            }
            await this.entityManager.save(entity);

            recipient.version = entity.version;
            recipient.viewCount = entity.viewCount;
            recipient.firstViewedAt = entity.firstViewedAt;
            recipient.lastViewedAt = entity.lastViewedAt;
        });
    }

    @Transactional()
    async registerFirebaseNotification(
        recipient: NotificationRecipient,
        appSession: AppSession,
        messageId: string,
    ): Promise<void> {
        return this.redisLockService.execute(`notification-recipients/${recipient.id}`, async () => {
            const entity = await this.notificationRecipientDao.getById(recipient.id);
            entity.publishedToFirebaseAt = new Date();
            entity.firebaseMessageId = messageId;
            entity.pushNotificationAppSession = appSession;
            await this.entityManager.save(entity);

            recipient.version = entity.version;
            recipient.publishedToFirebaseAt = entity.publishedToFirebaseAt;
            recipient.firebaseMessageId = entity.firebaseMessageId;
            recipient.pushNotificationAppSession = entity.pushNotificationAppSession;
        });
    }
}
