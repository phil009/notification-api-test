import { DIContainerModule, Inject, Injectable, InjectionToken, LazyDIContainer } from '@matchmakerjs/di';
import { QueueEngine, QueueProcessor } from '@matchmakerjs/matchmaker-cron';
import { RedisLockService } from '@matchmakerjs/matchmaker-redis';
import { ActivityLog, ActivityStatus, createActivity, finishActivity } from '@matchmakerjs/typeorm-audit';
import { RedisClientType } from '@redis/client';
import { EntityManager } from 'typeorm';
import { DateUtils } from '../../utils/date-util';
import { AppSessionDao } from '../dao/app-session.dao';
import { AppSession } from '../data/entities/app-session.entity';
import { PropertyUnitOccupant } from '../data/entities/external/tenure/property-unit-occupant.entity';
import { NotificationRecipient } from '../data/entities/notification-recipient.entity';
import { NotificationTarget } from '../data/entities/notification-target.entity';
import { UserNotification } from '../data/entities/notification.entity';
import { NotificationRecipientType } from '../data/enums/notification-recipient-type.enum';
import { FirebaseService } from '../integrations/firebase/firebase.service';
import { NotificationRecipientService } from '../services/notification-recipient.service';
import dayjs from 'dayjs';

function getAppIds() {
    return process.env.RESIDENT_APP_ID?.split(/, */)?.map((it) => it.trim());
}

@Injectable()
export class ResidentAppPushNotificationQueueProcessor implements QueueProcessor<UserNotification> {
    constructor(
        @Inject(InjectionToken.container) private container: LazyDIContainer,
        private entityManager: EntityManager,
        private appSessionDao: AppSessionDao,
        private firebaseService: FirebaseService,
    ) {}

    fetchItems(maxResults: number, skip?: UserNotification[]): Promise<UserNotification[]> {
        const APP_IDS = getAppIds();
        if (!APP_IDS?.length) return Promise.resolve([]);
        const qb = this.entityManager
            .createQueryBuilder(UserNotification, 'e')
            .innerJoin(NotificationTarget, 't', 't.notification=e.id')
            .leftJoin(
                PropertyUnitOccupant,
                'o',
                `(
                    t.type=:tenureRecipientType
                    AND o.tenure=t.tenureId 
                    AND (t.occupantType IS NULL OR t.occupantType=o.type)
                )`,
                { tenureRecipientType: NotificationRecipientType.TENURE },
            )
            .innerJoin(
                AppSession,
                'a',
                `(
                    a.endedAt IS NULL
                    AND (a.expiresAt IS NULL OR a.expiresAt > :now)
                    AND ((t.type=:userRecipientType AND a.userId=t.userId) OR a.userId=o.user)
                    AND a.applicationId IN (:...APP_IDS)
                    AND a.firebaseToken IS NOT NULL
                    AND a.lastSeenAt > :cutOffTime
                )`,
                {
                    now: DateUtils.toSql(new Date()),
                    APP_IDS,
                    userRecipientType: NotificationRecipientType.USER,
                    cutOffTime: DateUtils.toSql(dayjs().subtract(1, 'week').toDate()),
                },
            )
            .leftJoin(
                NotificationRecipient,
                'r',
                `(
                    r.userId=a.userId
                    AND r.notification=e.id
                )`,
            )
            .addSelect('a.userId', 'e_user_id')
            .where('a.id IS NOT NULL AND r.publishedToFirebaseAt IS NULL AND r.firstViewedAt IS NULL');
        skip?.forEach((it, i) =>
            qb.andWhere(`(e.id != :id_${i} OR a.userId != :user_id_${i})`, {
                [`id_${i}`]: it.id,
                [`user_id_${i}`]: it.userId,
            }),
        );
        return qb.distinct().limit(maxResults).getMany();
    }

    async processItem(item: UserNotification): Promise<void> {
        const container = this.container.clone([]);
        const activityLog: ActivityLog = createActivity('RESIDENT APP PUSH NOTIFICATION', container);

        let appSession: AppSession | null = null;
        try {
            appSession = await this.appSessionDao.getLatest({ userId: item.userId, appIds: getAppIds() });
            if (!appSession) {
                return;
            }
            let messageId = 'SKIPPED';
            if (item.audit.createdAt.getTime() >= new Date('2024-12-22').getTime()) {
                messageId = await this.firebaseService.sendNotification(item, appSession);
            }

            const notificationRecipientService = container.getInstance(NotificationRecipientService);
            const recipient = await notificationRecipientService.getOrCreateNotificationRecipient(item, item.userId);
            await notificationRecipientService.registerFirebaseNotification(recipient, appSession, messageId);
        } catch (error) {
            activityLog.status = ActivityStatus.FAILED;
            console.error(
                appSession?.id,
                appSession?.startedAt,
                appSession?.applicationId,
                appSession?.firebaseToken,
                error,
            );
            throw error;
        } finally {
            await finishActivity(activityLog, container.get(EntityManager));
        }
    }

    createTask(redisClient: RedisClientType, lockService: RedisLockService, containerModule: DIContainerModule) {
        return async () => {
            const now = Date.now();
            const latestKey = 'resident_app_push_notifications:latest';
            await redisClient.set(latestKey, now);
            await lockService.execute(
                'resident_app_push_notifications:active',
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
