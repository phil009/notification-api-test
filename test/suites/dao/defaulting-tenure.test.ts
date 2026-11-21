import { createContainer, LazyDIContainer } from '@matchmakerjs/di';
import { createTypeOrmModule, SqliteInMemoryConnectionOptions } from '@matchmakerjs/matchmaker-typeorm';
import * as dotenv from 'dotenv';
import { EntityManager } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { PropertyUnitOccupantDao } from '../../../src/app/dao/property-unit-occupant.dao';
import { TenureLedgerDao } from '../../../src/app/dao/tenure-ledger.dao';
import { OccupantApiResponseTypeEnum } from '../../../src/sdk/occupant-api-sdk';
import { createPropertyUnitOccupant } from '../../seeders/property-unit-occupant.seeder';
import { createPropertyUnitTenure } from '../../seeders/property-unit-tenure.seeder';
import { createPropertyUnit } from '../../seeders/property-unit.seeder';
import { createTenureLedger } from '../../seeders/tenure-ledger.seeder';
import { createUser } from '../../seeders/user.seeder';

describe('defaulting occupants', () => {
    let cleanUp: () => Promise<void>;
    let container: LazyDIContainer;

    beforeAll(async () => {
        dotenv.config();
        await createTypeOrmModule(
            SqliteInMemoryConnectionOptions({
                namingStrategy: new SnakeNamingStrategy(),
            }),
        ).then(async (typeOrmModule) => {
            [container, cleanUp] = createContainer({
                modules: [typeOrmModule],
            });
        });
    });

    afterAll(async () => cleanUp && cleanUp());

    afterEach(() => jest.resetAllMocks());

    it('should get defaulting occupants', async () => {
        const now = new Date();
        const entityManager = container.getInstance(EntityManager);
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
        const ledger = await createTenureLedger({
            entityManager,
            tenure: occupants[0].tenure,
            defaultedAt: now,
            sumOfInvoicesIssued: 1000,
            sumOfPaymentsReceived: 98.88,
        });

        const results = await container.getInstance(PropertyUnitOccupantDao).getDefaultingOccupantsToNotify(now, 10);
        expect(results?.length).toBe(1);
        expect(results[0].id).toBe(occupants[0].id);
        expect(results[0].tenure).toBeDefined();
        expect(results[0].tenure.propertyUnit).toBeDefined();

        const ledgers = await container
            .getInstance(TenureLedgerDao)
            .getOutstandingByTenures([occupants[0].tenure], now);
        expect(ledgers?.length).toBe(1);
        expect(ledgers[0].id).toBe(ledger.id);
        expect(ledgers[0].outstanding).toEqual(901.12);
    });
});
