import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { PropertyUnitSubscriptionLedgerEntryApiResponse } from '../../../../sdk/ledger-api-sdk';
import { PropertyUnitSubscriptionBillLedgerEntry } from '../../../data/entities/external/ledger/property-unit/property-unit-subscription-bill-ledger-entry.entity';
import { PropertyUnitSubscriptionLedger } from '../../../data/entities/external/ledger/property-unit/property-unit-subscription-ledger.entity';

@Injectable()
export class PropertyUnitSubscriptionBillLedgerEntryService {
    constructor(private entityManager: EntityManager) {}

    @Transactional()
    async create(
        data: PropertyUnitSubscriptionLedgerEntryApiResponse,
    ): Promise<PropertyUnitSubscriptionBillLedgerEntry> {
        const entity = new PropertyUnitSubscriptionBillLedgerEntry();
        await this.update(entity, data);
        return entity;
    }

    @Transactional()
    async update(
        entity: PropertyUnitSubscriptionBillLedgerEntry,
        data: PropertyUnitSubscriptionLedgerEntryApiResponse,
    ): Promise<void> {
        entity.id = data.id;
        entity.currency = data.subscriptionLedger.currency;
        entity.amount = data.amount;

        entity.propertyUnitSubscriptionLedger =
            data.subscriptionLedger?.id &&
            ({
                id: data.subscriptionLedger.id,
            } as PropertyUnitSubscriptionLedger);

        entity.effectiveAt = data.effectiveAt && new Date(data.effectiveAt);

        entity.startedAt = null;
        entity.endedAt = null;
        entity.originalBillId = null;

        if (data.scheduledBill) {
            const scheduledBill = data.scheduledBill;
            entity.startedAt = scheduledBill.startedAt && new Date(scheduledBill.startedAt);
            entity.endedAt = scheduledBill.endedAt && new Date(scheduledBill.endedAt);
            entity.originalBillId = scheduledBill.id;
        }

        entity.audit.version = data.version;
        entity.audit.createdAt = data.createdAt && new Date(data.createdAt);
        entity.audit.deactivatedAt = data.deactivatedAt && new Date(data.deactivatedAt);
        await this.entityManager.save(entity);
    }
}
