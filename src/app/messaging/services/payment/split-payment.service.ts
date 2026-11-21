import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { SplitPaymentApiResponse } from '../../../../sdk/payment-api-sdk';
import { SplitPayment } from '../../../data/entities/external/payment/split-payment.entity';

@Injectable()
export class SplitPaymentService {
    constructor(private entityManager: EntityManager) {}

    @Transactional()
    async create(data: SplitPaymentApiResponse): Promise<SplitPayment> {
        const entity = new SplitPayment();
        entity.id = data.id.toString();
        await this.update(entity, data);
        return entity;
    }

    @Transactional()
    async update(entity: SplitPayment, message: SplitPaymentApiResponse): Promise<SplitPayment> {
        entity.currency = message.currency;
        entity.amount = message.amount;
        entity.status = message.status;

        entity.audit.version = message.version;
        entity.audit.createdBy = message.createdBy;
        entity.audit.createdAt = message.createdAt && new Date(message.createdAt);
        entity.audit.receivedAt = new Date();
        await this.entityManager.save(entity);
        return entity;
    }
}
