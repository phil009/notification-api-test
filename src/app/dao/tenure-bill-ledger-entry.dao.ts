import { Injectable } from '@matchmakerjs/di';
import { EntityManager, SelectQueryBuilder } from 'typeorm';
import { TenureBillLedgerEntry } from '../data/entities/external/ledger/tenure/tenure-bill-ledger-entry.entity';

type CreateQueryOptions = {
    workspaceId?: string[];
    propertyOwnerId?: string[];
    propertyId?: string[];
    propertyUnitId?: string[];
    tenureId?: string[];
    currency?: string;
    effectiveAfter?: Date;
    qb?: SelectQueryBuilder<TenureBillLedgerEntry>;
};

@Injectable()
export class TenureBillLedgerEntryDao {
    constructor(private entityManager: EntityManager) {}

    createQuery(filter: CreateQueryOptions, alias = 'e') {
        const {
            // workspaceId,
            // propertyOwnerId,
            // propertyId,
            // propertyUnitId,
            tenureId,
            currency,
            effectiveAfter,
        } = filter;
        const qb = filter.qb || this.entityManager.createQueryBuilder(TenureBillLedgerEntry, alias);
        qb.innerJoin(`${alias}.tenure`, `${alias}_t`);

        if (tenureId?.length) {
            qb.andWhere(`${alias}_t.id IN (:...tenureId)`, { tenureId });
        }
        if (currency) {
            qb.andWhere(`${alias}.currency = :currency`, { currency });
        }
        if (effectiveAfter) {
            qb.andWhere(`${alias}.effectiveAt > :effectiveAfter`, { effectiveAfter });
        }

        return qb;
    }

    createSummaryQuery(filter: CreateQueryOptions, alias = 'e') {
        const qb = this.createQuery(filter, alias);
        qb.select(`${alias}.tenureLedger`, 'ledger_id');
        qb.addSelect(`${alias}.currency`, 'currency');
        qb.addSelect(`COALESCE(SUM(${alias}.amount), 0)`, 'sum');
        qb.addSelect(`COALESCE(COUNT(${alias}.id), 0)`, 'count');
        qb.addSelect(`MIN(${alias}.effectiveAt)`, 'starting_at');
        qb.addGroupBy(`${alias}.tenureLedger`);
        qb.addGroupBy(`${alias}.currency`);
        return qb;
    }
}
