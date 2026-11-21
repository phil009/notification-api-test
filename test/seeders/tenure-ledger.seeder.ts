import { randomUUID } from 'crypto';
import * as faker from 'faker';
import { EntityManager } from 'typeorm';
import { TenureLedger } from '../../src/app/data/entities/external/ledger/tenure/tenure-ledger.entity';
import { PropertyUnitTenure } from '../../src/app/data/entities/external/tenure/property-unit-tenure.entity';
import { TenureLedgerApiResponseTypeEnum } from '../../src/sdk/ledger-api-sdk';
import { createPropertyUnitTenure } from './property-unit-tenure.seeder';

export const createTenureLedger = async ({
    entityManager,
    tenure,
    currency,
    ledgerType,
    sumOfInvoicesIssued,
    sumOfPaymentsReceived,
    defaultedAt,
}: {
    entityManager: EntityManager;
    workspaceId?: string;
    tenure?: PropertyUnitTenure;
    currency?: string;
    sumOfInvoicesIssued?: number;
    sumOfPaymentsReceived?: number;
    defaultedAt?: Date;
    ledgerType?: TenureLedgerApiResponseTypeEnum;
}) => {
    const entity = new TenureLedger();
    entity.id = randomUUID();
    entity.tenure =
        tenure ||
        (await createPropertyUnitTenure({
            entityManager,
        }));
    entity.currency = currency || faker.finance.currencyCode();
    entity.type = ledgerType || TenureLedgerApiResponseTypeEnum.Rent;
    entity.sumOfInvoicesIssued = sumOfInvoicesIssued || 0;
    entity.sumOfPaymentsReceived = sumOfPaymentsReceived || 0;
    entity.defaultedAt = defaultedAt;
    return entityManager.save(entity);
};
