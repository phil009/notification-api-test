import { Injectable } from '@matchmakerjs/di';
import { EntityManager } from 'typeorm';
import { TenureBillLedgerEntry } from '../data/entities/external/ledger/tenure/tenure-bill-ledger-entry.entity';
import { TenureLedger } from '../data/entities/external/ledger/tenure/tenure-ledger.entity';
import { PropertyUnitTenure } from '../data/entities/external/tenure/property-unit-tenure.entity';
import { TenureBillLedgerEntryDao } from './tenure-bill-ledger-entry.dao';

@Injectable()
export class TenureLedgerDao {
    constructor(private entityManager: EntityManager, private tenureBillLedgerEntryDao: TenureBillLedgerEntryDao) {}

    async getOutstandingByTenures(tenures: PropertyUnitTenure[], now: Date): Promise<TenureLedger[]> {
        if (!tenures?.length) return [];
        const tenureIds = tenures.map((it) => it.id);
        const qb = this.entityManager
            .createQueryBuilder(TenureLedger, 'e')
            .leftJoinAndSelect('e.tenure', 't')
            .andWhere('t.id IN (:...tenureIds)', { tenureIds });
        qb.leftJoin(
            (sq) =>
                this.tenureBillLedgerEntryDao.createSummaryQuery({
                    tenureId: tenureIds,
                    effectiveAfter: now,
                    qb: sq.from(TenureBillLedgerEntry, 'e'),
                }),
            'inv',
            'inv.ledger_id=e.id',
        );
        const outstanding = '(e.sumOfInvoicesIssued - COALESCE(inv.sum, 0) - e.sumOfPaymentsReceived)';
        qb.andWhere(`${outstanding} > 0`);
        qb.addSelect(outstanding, 'outstanding');
        const result = await qb.getRawAndEntities();
        return result.entities.map((entity, i) => {
            entity.outstanding = result.raw[i]['outstanding'] || 0;
            return entity;
        });
    }
}
