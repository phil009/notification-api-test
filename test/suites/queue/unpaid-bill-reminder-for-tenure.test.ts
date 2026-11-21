import { createContainer, LazyDIContainer } from '@matchmakerjs/di';
import { createTypeOrmModule, SqliteInMemoryConnectionOptions } from '@matchmakerjs/matchmaker-typeorm';
import dayjs from 'dayjs';
import * as dotenv from 'dotenv';
import { EntityManager } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { TenureLedger } from '../../../src/app/data/entities/external/ledger/tenure/tenure-ledger.entity';
import {
    PropertyUnitOccupant,
    _PropertyUnitOccupant,
} from '../../../src/app/data/entities/external/tenure/property-unit-occupant.entity';
import { MailSender } from '../../../src/app/integrations/email/mail-sender';
import { UnpaidBillReminderForOccupantQueueProcessor } from '../../../src/app/queue-processors/unpaid-bill-reminder-for-occupant.queue';
import { UnpaidBillNotificationService } from '../../../src/app/services/unpaid-bill-notification.service';
import { OccupantApiResponseTypeEnum } from '../../../src/sdk/occupant-api-sdk';
import { TemplateEngine } from '../../../src/utils/template-engine';
import { createPropertyUnitOccupant } from '../../seeders/property-unit-occupant.seeder';
import { createPropertyUnitTenure } from '../../seeders/property-unit-tenure.seeder';
import { createPropertyUnit } from '../../seeders/property-unit.seeder';
import { createTenureLedger } from '../../seeders/tenure-ledger.seeder';
import { createUser } from '../../seeders/user.seeder';

describe('send unpaid bill reminder occupants', () => {
    let cleanUp: () => Promise<void>;
    let container: LazyDIContainer;

    const prepareMailData = jest.fn();
    const compile = jest.fn();
    const sendMail = jest.fn();

    beforeAll(async () => {
        dotenv.config();
        await createTypeOrmModule(
            SqliteInMemoryConnectionOptions({
                namingStrategy: new SnakeNamingStrategy(),
            }),
        ).then(async (typeOrmModule) => {
            [container, cleanUp] = createContainer({
                modules: [
                    typeOrmModule,
                    {
                        providers: [
                            {
                                provide: MailSender,
                                with: () =>
                                    ({
                                        sendMail,
                                    } as MailSender),
                            },
                            {
                                provide: TemplateEngine,
                                with: () =>
                                    ({
                                        compile,
                                    } as TemplateEngine),
                            },
                            {
                                provide: UnpaidBillNotificationService,
                                with: () =>
                                    ({
                                        prepareMailData: (_, __) => prepareMailData(_, __),
                                    } as UnpaidBillNotificationService),
                            },
                        ],
                        isHealthy: async () => true,
                    },
                ],
            });
        });
    });

    afterAll(async () => cleanUp && cleanUp());

    afterEach(async () => {
        jest.resetAllMocks();
        const entityManager = container.getInstance(EntityManager);
        await entityManager
            .find(TenureLedger)
            .then((ledgers) => Promise.all(ledgers.map((ledger) => entityManager.remove(ledger))));
    });

    it('should update notified occupants', async () => {
        const entityManager = container.getInstance(EntityManager);
        const queueProcessor = container.getInstance(UnpaidBillReminderForOccupantQueueProcessor);

        const occupants = await Promise.all([
            createPropertyUnit({ entityManager }),
            createPropertyUnit({ entityManager }),
        ]).then((units) =>
            Promise.all(
                units.map((unit) =>
                    createPropertyUnitTenure({ entityManager, unit }).then(async (tenure) =>
                        createPropertyUnitOccupant({
                            entityManager,
                            tenure,
                            type: OccupantApiResponseTypeEnum.Primary,
                            user: await createUser({ entityManager }),
                        }),
                    ),
                ),
            ),
        );

        const now = new Date();
        await createTenureLedger({
            entityManager,
            tenure: occupants[0].tenure,
            defaultedAt: now,
            sumOfInvoicesIssued: 1000,
            sumOfPaymentsReceived: 98.88,
        });

        const results = await queueProcessor.fetchItems(10);
        expect(results?.length).toBe(1);
        expect(results[0].id).toBe(occupants[0].id);

        prepareMailData.mockResolvedValue({});

        await queueProcessor.processItem(results[0]);

        const processedOccupant = await entityManager.findOne(PropertyUnitOccupant, {
            where: { id: occupants[0].id },
        });
        expect(processedOccupant.lastUnpaidBillNotificationAt).toBeDefined();
        expect(prepareMailData).toBeCalledTimes(1);
        expect(compile).toBeCalledTimes(1);
        expect(sendMail).toBeCalledTimes(1);
    });

    it('should skip notified occupants', async () => {
        const now = new Date();
        const entityManager = container.getInstance(EntityManager);

        const occupants = await Promise.all([
            createPropertyUnit({ entityManager }),
            createPropertyUnit({ entityManager }),
        ]).then((units) =>
            Promise.all(
                units.map((unit) =>
                    createPropertyUnitTenure({ entityManager, unit }).then(async (tenure) => {
                        await createTenureLedger({
                            entityManager,
                            tenure,
                            defaultedAt: now,
                            sumOfInvoicesIssued: 1000,
                            sumOfPaymentsReceived: 98.88,
                        });
                        return createPropertyUnitOccupant({
                            entityManager,
                            tenure,
                            type: OccupantApiResponseTypeEnum.Primary,
                            user: await createUser({ entityManager }),
                        });
                    }),
                ),
            ),
        );

        await entityManager
            .createQueryBuilder(_PropertyUnitOccupant, 'e')
            .update()
            .where('id = :id', { id: occupants[0].id })
            .set({
                lastUnpaidBillNotificationAt: dayjs().startOf('month').subtract(1, 'millisecond').toDate(),
            })
            .callListeners(false)
            .execute();

        await entityManager
            .createQueryBuilder(_PropertyUnitOccupant, 'e')
            .update()
            .where('id = :id', { id: occupants[1].id })
            .set({
                lastUnpaidBillNotificationAt: dayjs().startOf('month').toDate(),
            })
            .callListeners(false)
            .execute();

        const results = await container.getInstance(UnpaidBillReminderForOccupantQueueProcessor).fetchItems(10);
        expect(results?.length).toBe(1);
        expect(results[0].id).toBe(occupants[0].id);

        // const lastUnpaidBillNotificationAt = dayjs();
        // const lastNotifiedBefore = dayjs().startOf('month');
        // const queryResult = await entityManager.query(`SELECT
        // Datetime(?) lastUnpaidBillNotificationAt,
        // Datetime(?) lastNotifiedBefore,
        // Datetime(?) < Datetime(?) notifiedInPast
        // WHERE ? < ?`,
        //     [
        //         lastUnpaidBillNotificationAt.toISOString(),
        //         lastNotifiedBefore.toISOString(),
        //         lastUnpaidBillNotificationAt.toISOString(),
        //         lastNotifiedBefore.toISOString(),
        //         lastUnpaidBillNotificationAt.toISOString(),
        //         lastNotifiedBefore.toISOString()
        //     ]);
        // console.log(queryResult);
    });
});
