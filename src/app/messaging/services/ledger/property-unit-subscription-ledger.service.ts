import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { PropertyUnitSubscriptionLedgerApiResponse } from '../../../../sdk/ledger-api-sdk';
import { PropertyUnitSubscriptionLedger } from '../../../data/entities/external/ledger/property-unit/property-unit-subscription-ledger.entity';
import { PropertyOwner } from '../../../data/entities/external/property/property-owner.entity';
import { Workspace } from '../../../data/entities/external/workspace/workspace.entity';

@Injectable()
export class PropertyUnitSubscriptionLedgerService {
    constructor(private entityManager: EntityManager) {}

    @Transactional()
    async create(data: PropertyUnitSubscriptionLedgerApiResponse): Promise<PropertyUnitSubscriptionLedger> {
        const entity = new PropertyUnitSubscriptionLedger();
        entity.id = data.id;
        await this.update(entity, data);
        return entity;
    }

    @Transactional()
    async update(
        entity: PropertyUnitSubscriptionLedger,
        data: PropertyUnitSubscriptionLedgerApiResponse,
    ): Promise<void> {
        entity.currency = data.currency;

        entity.workspace =
            data.workspaceId &&
            ({
                id: data.workspaceId,
            } as Workspace);

        entity.propertyOwner =
            data.propertyOwner &&
            ({
                id: data.propertyOwner.id,
            } as PropertyOwner);

        entity.sumOfInvoicesIssued = data.sumOfInvoicesIssued;
        entity.sumOfPaymentsReceived = data.sumOfPaymentsReceived;

        entity.audit.version = data.version;
        await this.entityManager.save(entity);
    }
}
