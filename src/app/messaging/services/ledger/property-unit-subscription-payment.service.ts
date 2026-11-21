import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { PropertyUnitSubscriptionPaymentApiResponse } from '../../../../sdk/ledger-api-sdk';
import { OfflinePayment } from '../../../data/entities/external/ledger/offline-payment.entity';
import { PropertyUnitSubscriptionLedger } from '../../../data/entities/external/ledger/property-unit/property-unit-subscription-ledger.entity';
import { PropertyUnitSubscriptionPayment } from '../../../data/entities/external/ledger/property-unit/property-unit-subscription-payment.entity';
import { SplitPayment } from '../../../data/entities/external/payment/split-payment.entity';
import { WalletTransaction } from '../../../data/entities/external/payment/wallet-transaction.entity';

@Injectable()
export class PropertyUnitSubscriptionPaymentService {
    constructor(private entityManager: EntityManager) {}

    @Transactional()
    async create(data: PropertyUnitSubscriptionPaymentApiResponse): Promise<PropertyUnitSubscriptionPayment> {
        const entity = new PropertyUnitSubscriptionPayment();
        entity.id = data.id;
        await this.update(entity, data);
        return entity;
    }

    @Transactional()
    async update(
        entity: PropertyUnitSubscriptionPayment,
        data: PropertyUnitSubscriptionPaymentApiResponse,
    ): Promise<void> {
        entity.currency = data.propertyUnitSubscriptionLedger?.currency;
        entity.amount = data.amount;

        entity.propertyUnitSubscriptionLedger =
            data.propertyUnitSubscriptionLedger?.id &&
            ({
                id: data.propertyUnitSubscriptionLedger.id,
            } as PropertyUnitSubscriptionLedger);

        entity.walletTransaction =
            data?.walletTransaction?.id &&
            ({
                id: data.walletTransaction.id,
            } as WalletTransaction);
        entity.splitPayment =
            data?.splitPayment?.id &&
            ({
                id: data.splitPayment.id,
            } as SplitPayment);
        entity.offlinePayment =
            data?.offlinePayment?.id &&
            ({
                id: data.offlinePayment.id,
            } as OfflinePayment);

        entity.audit.version = data.version;
        entity.audit.createdAt = data.createdAt && new Date(data.createdAt);
        entity.audit.deactivatedAt = data.deactivatedAt && new Date(data.deactivatedAt);
        await this.entityManager.save(entity);
    }
}
