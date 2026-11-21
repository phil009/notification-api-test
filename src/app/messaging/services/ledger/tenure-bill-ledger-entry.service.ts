import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { TenureLedgerEntryApiResponse } from '../../../../sdk/ledger-api-sdk';
import { TenureBillLedgerEntry } from '../../../data/entities/external/ledger/tenure/tenure-bill-ledger-entry.entity';
import { TenureLedger } from '../../../data/entities/external/ledger/tenure/tenure-ledger.entity';
import { PropertyUnitTenure } from '../../../data/entities/external/tenure/property-unit-tenure.entity';

@Injectable()
export class TenureBillLedgerEntryService {
    constructor(private entityManager: EntityManager) {}

    @Transactional()
    async create(data: TenureLedgerEntryApiResponse): Promise<TenureBillLedgerEntry> {
        const entity = new TenureBillLedgerEntry();
        await this.update(entity, data);
        return entity;
    }

    @Transactional()
    async update(entity: TenureBillLedgerEntry, data: TenureLedgerEntryApiResponse): Promise<void> {
        entity.id = data.id;
        entity.ledgerType = data.tenureLedger.type;
        entity.currency = data.tenureLedger.currency;
        entity.amount = data.amount;

        entity.tenure = {
            id: data.tenureLedger.tenure.id,
        } as PropertyUnitTenure;

        entity.tenureLedger = {
            id: data.tenureLedger.id,
        } as TenureLedger;

        entity.effectiveAt = data.effectiveAt && new Date(data.effectiveAt);

        entity.startedAt = null;
        entity.endedAt = null;
        entity.expiryNoticeAt = null;
        if (data.adhocBill) {
            const adhocBill = data.adhocBill;
            entity.startedAt = adhocBill.startedAt && new Date(adhocBill.startedAt);
            entity.endedAt = adhocBill.endedAt && new Date(adhocBill.endedAt);
            entity.expiryNoticeAt = adhocBill.expiryNoticeAt && new Date(adhocBill.expiryNoticeAt);
        } else if (data.scheduledBill) {
            const scheduledBill = data.scheduledBill;
            entity.startedAt = scheduledBill.startedAt && new Date(scheduledBill.startedAt);
            entity.endedAt = scheduledBill.endedAt && new Date(scheduledBill.endedAt);
            entity.expiryNoticeAt = scheduledBill.expiryNoticeAt && new Date(scheduledBill.expiryNoticeAt);
            entity.originalBillId = scheduledBill.id;
        }

        entity.audit.version = data.version;
        entity.audit.createdAt = data.createdAt && new Date(data.createdAt);
        entity.audit.deactivatedAt = data.deactivatedAt && new Date(data.deactivatedAt);
        await this.entityManager.save(entity);
    }
}
