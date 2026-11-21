import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { CustomerWallet } from '../../../data/entities/external/payment/customer-wallet.entity';
import { Customer } from '../../../data/entities/external/payment/customer.entity';
import { Wallet } from '../../../data/entities/external/payment/wallet.entity';
import { CustomerWalletMessage } from '../../messages/customer-wallet.message';

@Injectable()
export class CustomerWalletService {
    constructor(private entityManager: EntityManager) { }

    @Transactional()
    async create(data: CustomerWalletMessage): Promise<CustomerWallet> {
        const entity = new CustomerWallet();
        entity.id = data.id.toString();
        await this.update(entity, data);
        return entity;
    }

    @Transactional()
    async update(entity: CustomerWallet, data: CustomerWalletMessage): Promise<void> {
        entity.customer = {
            id: data.customer.id,
        } as Customer;
        entity.wallet = {
            id: data.wallet.id,
        } as Wallet;

        entity.audit.version = data.version;
        entity.audit.createdAt = data.createdAt && new Date(data.createdAt);
        entity.audit.deactivatedAt = data.deactivatedAt && new Date(data.deactivatedAt);

        await this.entityManager.save(entity);
    }
}
