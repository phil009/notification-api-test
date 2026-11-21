import { ConstructorFunction, DIContainerModule, LazyDIContainer } from '@matchmakerjs/di';
import { CronScheduler } from '@matchmakerjs/matchmaker-cron';
import { KAFKA_PRODUCER } from '@matchmakerjs/matchmaker-kafkajs';
import { RedisLockService } from '@matchmakerjs/matchmaker-redis';
import { RedisClientType } from '@redis/client';
import { Producer } from 'kafkajs';
import { ManagerAppPushNotificationQueueProcessor } from './manager-app-push-notification.queue';
import { MaintenanceRequestCreatedNotificationQueueProcessor } from './maintenance-request-created-notification.queue';
import { MaintenanceRequestStatusNotificationQueueProcessor } from './maintenance-request-status-notification.queue';
import { MonthlyPortfolioSummaryQueueProcessor } from './monthly-portfolio-summary.queue';
import { RentDueReminderForOccupantQueueProcessor } from './rent-due-reminder-for-occupant.queue';
import { RentExpiryReminderForManagerQueueProcessor } from './rent-expiry-reminder-for-manager.queue';
import { ResidentAppPushNotificationQueueProcessor } from './resident-app-push-notification.queue';
import { UnpaidBillReminderForOccupantQueueProcessor } from './unpaid-bill-reminder-for-occupant.queue';

export const startProducerQueueProcessors = (
    container: LazyDIContainer,
    redisClient: RedisClientType,
    kafkaProducerModule: DIContainerModule,
) => {
    const producer: Producer = container.get(KAFKA_PRODUCER);
    producer.on('producer.connect', () => {
        const scheduler = container.getInstance(CronScheduler as ConstructorFunction<CronScheduler>);
        const lockService = container.getInstance(RedisLockService as ConstructorFunction<RedisLockService>);

        scheduler.scheduleCronTask(
            '*/2 * * * *',
            container
                .getInstance(ResidentAppPushNotificationQueueProcessor)
                .createTask(redisClient, lockService, kafkaProducerModule),
        );
        scheduler.scheduleCronTask(
            '*/2 * * * *',
            container
                .getInstance(ManagerAppPushNotificationQueueProcessor)
                .createTask(redisClient, lockService, kafkaProducerModule),
        );
        scheduler.scheduleCronTask(
            '*/2 * * * *',
            container
                .getInstance(MaintenanceRequestCreatedNotificationQueueProcessor)
                .createTask(redisClient, lockService, kafkaProducerModule),
        );
        scheduler.scheduleCronTask(
            '*/2 * * * *',
            container
                .getInstance(MaintenanceRequestStatusNotificationQueueProcessor)
                .createTask(redisClient, lockService, kafkaProducerModule),
        );
        scheduler.scheduleCronTask(
            '*/2 * * * *',
            container
                .getInstance(UnpaidBillReminderForOccupantQueueProcessor)
                .createTask(redisClient, lockService, kafkaProducerModule),
        );
        scheduler.scheduleCronTask(
            '*/2 * * * *',
            container
                .getInstance(RentExpiryReminderForManagerQueueProcessor)
                .createTask(redisClient, lockService, kafkaProducerModule),
        );
        // scheduler.scheduleCronTask(
        //     '*/2 * * * *',
        //     container
        //         .getInstance(OverdueRentReminderForManagerQueueProcessor)
        //         .createTask(redisClient, lockService, kafkaProducerModule),
        // );
        // v2 sends one summary email per workspace instead of one per defaulting occupant - enable
        // this instead of (not in addition to) the v1 processor above.
        // scheduler.scheduleCronTask(
        //     '*/2 * * * *',
        //     container
        //         .getInstance(OverdueRentReminderForManagerV2QueueProcessor)
        //         .createTask(redisClient, lockService, kafkaProducerModule),
        // );
        scheduler.scheduleCronTask(
            '*/2 * * * *',
            container
                .getInstance(RentDueReminderForOccupantQueueProcessor)
                .createTask(redisClient, lockService, kafkaProducerModule),
        );
        // Hourly from 08:00 to 20:00 on days 28-31; the processor itself only acts on the last day.
        scheduler.scheduleCronTask(
            '0 8-20 28-31 * *',
            container
                .getInstance(MonthlyPortfolioSummaryQueueProcessor)
                .createTask(redisClient, lockService, kafkaProducerModule),
        );
    });
};
