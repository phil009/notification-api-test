import { createContainer, LazyDIContainer } from '@matchmakerjs/di';
import { createTypeOrmModule, SqliteInMemoryConnectionOptions } from '@matchmakerjs/matchmaker-typeorm';
import { randomUUID } from 'crypto';
import dayjs from 'dayjs';
import * as dotenv from 'dotenv';
import { EntityManager } from 'typeorm';
import { NotificationTarget } from '../../../src/app/data/entities/notification-target.entity';
import { Notification, UserNotification } from '../../../src/app/data/entities/notification.entity';
import { NotificationType } from '../../../src/app/data/enums/notification-type.enum';
import { FirebaseService } from '../../../src/app/integrations/firebase/firebase.service';
import { ResidentAppPushNotificationQueueProcessor } from '../../../src/app/queue-processors/resident-app-push-notification.queue';
import { NotificationTargetService } from '../../../src/app/services/notification-target.service';
import { LedgerApiOccupantApiResponseTypeEnum } from '../../../src/sdk/ledger-api-sdk';
import { OccupantApiResponseTypeEnum } from '../../../src/sdk/occupant-api-sdk';
import { createAppSession } from '../../seeders/app-session.seeder';
import { createNotification } from '../../seeders/notification.seeder';
import { createPropertyUnitOccupant } from '../../seeders/property-unit-occupant.seeder';
import { createPropertyUnitTenure } from '../../seeders/property-unit-tenure.seeder';
import { createUser } from '../../seeders/user.seeder';

async function createNotificationForUser(container: LazyDIContainer, userId: string) {
    const notification = await createNotification({
        entityManager: container.getInstance(EntityManager),
        type: NotificationType.WALLET_TOP_UP,
    });
    return container.getInstance(NotificationTargetService).createForUser(notification, userId);
}

describe('fetch pending push notifications', () => {
    let cleanUp: () => Promise<void>;
    let container: LazyDIContainer;

    beforeAll(async () => {
        dotenv.config();
        await createTypeOrmModule(SqliteInMemoryConnectionOptions()).then(async (typeOrmModule) => {
            [container, cleanUp] = createContainer({
                modules: [
                    typeOrmModule,
                    {
                        isHealthy: () => Promise.resolve(true),
                        providers: [
                            {
                                provide: FirebaseService,
                                with: () => ({}),
                            },
                        ],
                    },
                ],
            });
        });
    });

    afterAll(async () => cleanUp && cleanUp());

    afterEach(async () => {
        const entityManager = container.getInstance(EntityManager);
        await entityManager.createQueryBuilder(NotificationTarget, 'e').delete().execute();
        await entityManager.createQueryBuilder(Notification, 'e').delete().execute();
        return jest.resetAllMocks();
    });

    it('should list empty pending push notifications', async () => {
        process.env.RESIDENT_APP_ID = randomUUID();
        const skips: UserNotification[] = [];
        skips.forEach = jest.fn();
        const results = await container.getInstance(ResidentAppPushNotificationQueueProcessor).fetchItems(10, skips);
        expect(results.length).toBe(0);
        expect(skips.forEach).toBeCalledTimes(1);
    });

    it('should get pending push notifications for user with active session', async () => {
        process.env.RESIDENT_APP_ID = randomUUID();
        const userId = randomUUID();

        await createNotificationForUser(container, userId);

        await createAppSession({
            userId,
            entityManager: container.getInstance(EntityManager),
            applicationId: process.env.RESIDENT_APP_ID,
            startedAt: new Date(),
            expiresAt: dayjs(new Date()).add(1, 'minute').toDate(),
        });

        const results = await container.getInstance(ResidentAppPushNotificationQueueProcessor).fetchItems(10);
        expect(results.length).toBe(1);
        expect(results[0].userId).toBe(userId);
    });

    it('should get pending push notifications for user with multiple active session', async () => {
        process.env.RESIDENT_APP_ID = randomUUID();
        const userId = randomUUID();

        await createNotificationForUser(container, userId);

        for (let i = 0; i < 3; i++) {
            await createAppSession({
                userId,
                entityManager: container.getInstance(EntityManager),
                applicationId: process.env.RESIDENT_APP_ID,
                startedAt: new Date(),
                expiresAt: dayjs(new Date()).add(1, 'minute').toDate(),
            });
        }

        const results = await container.getInstance(ResidentAppPushNotificationQueueProcessor).fetchItems(10);
        expect(results.length).toBe(1);
    });

    it('should get pending push notifications for user without active session', async () => {
        process.env.RESIDENT_APP_ID = randomUUID();
        const userId = randomUUID();

        await createNotificationForUser(container, userId);

        await createAppSession({
            userId,
            entityManager: container.getInstance(EntityManager),
            applicationId: process.env.RESIDENT_APP_ID,
            startedAt: new Date(),
            endedAt: new Date(),
            expiresAt: dayjs(new Date()).add(1, 'minute').toDate(),
        });

        const results = await container.getInstance(ResidentAppPushNotificationQueueProcessor).fetchItems(10);
        expect(results.length).toBe(0);
    });

    it('should get pending push notifications for user with expired session', async () => {
        process.env.RESIDENT_APP_ID = randomUUID();
        const userId = randomUUID();

        await createNotificationForUser(container, userId);

        await createAppSession({
            userId,
            entityManager: container.getInstance(EntityManager),
            applicationId: process.env.RESIDENT_APP_ID,
            startedAt: new Date(),
            expiresAt: new Date(),
        });

        const results = await container.getInstance(ResidentAppPushNotificationQueueProcessor).fetchItems(10);
        expect(results.length).toBe(0);
    });

    it('should get pending push notifications for occupant', async () => {
        process.env.RESIDENT_APP_ID = randomUUID();
        const entityManager = container.getInstance(EntityManager);
        const user = await createUser({ entityManager });

        const tenure = await createPropertyUnitTenure({
            entityManager,
        });
        await createPropertyUnitOccupant({
            entityManager,
            tenure,
            user,
            type: OccupantApiResponseTypeEnum.Primary,
        });

        const notification = await createNotification({
            entityManager: container.getInstance(EntityManager),
            type: NotificationType.TENURE_SERVICE_CHARGE,
        });
        await container
            .getInstance(NotificationTargetService)
            .createForOccupant(notification, tenure.id, LedgerApiOccupantApiResponseTypeEnum.Primary);

        await createAppSession({
            entityManager,
            userId: user.userId,
            applicationId: process.env.RESIDENT_APP_ID,
            startedAt: new Date(),
            expiresAt: dayjs(new Date()).add(1, 'minute').toDate(),
        });

        const results = await container.getInstance(ResidentAppPushNotificationQueueProcessor).fetchItems(10);
        expect(results.length).toBe(1);
        expect(results[0].userId).toBe(user.userId);
    });

    it('should get pending push notifications for occupant', async () => {
        process.env.RESIDENT_APP_ID = randomUUID();
        const entityManager = container.getInstance(EntityManager);
        const user = await createUser({ entityManager });

        const tenure = await createPropertyUnitTenure({
            entityManager,
        });
        await createPropertyUnitOccupant({
            entityManager,
            tenure,
            user,
            type: OccupantApiResponseTypeEnum.Dependant,
        });

        const notification = await createNotification({
            entityManager,
            type: NotificationType.TENURE_SERVICE_CHARGE,
        });
        await container.getInstance(NotificationTargetService).createForOccupant(notification, tenure.id, null);

        await createAppSession({
            entityManager,
            userId: user.userId,
            applicationId: process.env.RESIDENT_APP_ID,
            startedAt: new Date(),
            expiresAt: dayjs(new Date()).add(1, 'minute').toDate(),
        });

        const results = await container.getInstance(ResidentAppPushNotificationQueueProcessor).fetchItems(10);
        expect(results.length).toBe(1);
        expect(results[0].userId).toBe(user.userId);
    });

    it('should get no push notification for occupant', async () => {
        process.env.RESIDENT_APP_ID = randomUUID();
        const entityManager = container.getInstance(EntityManager);
        const user = await createUser({ entityManager });

        const tenure = await createPropertyUnitTenure({
            entityManager,
        });
        await createPropertyUnitOccupant({
            entityManager,
            tenure,
            user,
            type: OccupantApiResponseTypeEnum.Dependant,
        });

        const notification = await createNotification({
            entityManager,
            type: NotificationType.TENURE_SERVICE_CHARGE,
        });
        await container
            .getInstance(NotificationTargetService)
            .createForOccupant(notification, tenure.id, LedgerApiOccupantApiResponseTypeEnum.Primary);

        await createAppSession({
            entityManager,
            userId: user.userId,
            applicationId: process.env.RESIDENT_APP_ID,
            startedAt: new Date(),
            expiresAt: dayjs(new Date()).add(1, 'minute').toDate(),
        });

        const results = await container.getInstance(ResidentAppPushNotificationQueueProcessor).fetchItems(10);
        expect(results.length).toBe(0);
    });
});
