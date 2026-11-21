import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { PaymentApiCustomerApiResponseTypeEnum, WalletApiResponse } from '../../../../sdk/payment-api-sdk';
import { Wallet } from '../../../data/entities/external/payment/wallet.entity';
import { PortalUser } from '../../../data/entities/external/portal-user.entity';
import { PropertyOwner } from '../../../data/entities/external/property/property-owner.entity';
import { Workspace } from '../../../data/entities/external/workspace/workspace.entity';

@Injectable()
export class WalletService {
    constructor(private entityManager: EntityManager) { }

    @Transactional()
    async create(data: WalletApiResponse): Promise<Wallet> {
        const entity = new Wallet();
        entity.id = data.id.toString();
        await this.update(entity, data);
        return entity;
    }

    @Transactional()
    async update(entity: Wallet, data: WalletApiResponse): Promise<void> {
        entity.currency = data.currency;
        entity.balance = data.balance;
        entity.balanceLastUpdatedAt = data.balanceLastUpdatedAt && new Date(data.balanceLastUpdatedAt);
        entity.sumOfQueuedDebitTransactions = data.sumOfQueuedDebitTransactions;
        entity.isFreeCredit = !!data.freeCredit;
        entity.expiresAt = data.expiresAt && new Date(data.expiresAt);
        data.customer = {
            id: data.customer?.id
        };

        if (data.customer.type === PaymentApiCustomerApiResponseTypeEnum.User) {
            entity.portalUser = {
                userId: data.customer.reference,
            } as PortalUser;
        }
        if (data.customer.type === PaymentApiCustomerApiResponseTypeEnum.PropertyOwner) {
            entity.propertyOwner = {
                id: data.customer.reference,
            } as PropertyOwner;
        }
        if (data.customer.type === PaymentApiCustomerApiResponseTypeEnum.Organisation) {
            entity.workspace = {
                id: data.customer.reference,
            } as Workspace;
        }

        entity.audit.version = data.version;

        await this.entityManager.save(entity);
    }
}
