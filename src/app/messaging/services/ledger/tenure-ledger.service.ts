import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { TenureLedgerApiResponse } from '../../../../sdk/ledger-api-sdk';
import { TenureLedger } from '../../../data/entities/external/ledger/tenure/tenure-ledger.entity';
import { PropertyUnitTenure } from '../../../data/entities/external/tenure/property-unit-tenure.entity';

@Injectable()
export class TenureLedgerService {
    constructor(private entityManager: EntityManager) {}

    @Transactional()
    async create(data: TenureLedgerApiResponse): Promise<TenureLedger> {
        const entity = new TenureLedger();
        entity.id = data.id;
        await this.update(entity, data);
        return entity;
    }

    @Transactional()
    async update(entity: TenureLedger, data: TenureLedgerApiResponse): Promise<void> {
        entity.type = data.type;
        entity.currency = data.currency;

        entity.tenure = {
            id: data.tenure.id,
        } as PropertyUnitTenure;

        entity.sumOfInvoicesIssued = data.sumOfInvoicesIssued;
        entity.sumOfPaymentsReceived = data.sumOfPaymentsReceived;
        entity.defaultedAt = data.defaultedAt && new Date(data.defaultedAt);

        entity.audit.version = data.version;
        await this.entityManager.save(entity);
    }
}
