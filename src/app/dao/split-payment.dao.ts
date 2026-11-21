import { Injectable } from '@matchmakerjs/di';
import { EntityManager } from 'typeorm';
import { SplitPayment } from '../data/entities/external/payment/split-payment.entity';

@Injectable()
export class SplitPaymentDao {
    constructor(private entityManager: EntityManager) {}

    async getById(id: string): Promise<SplitPayment> {
        return this.entityManager.createQueryBuilder(SplitPayment, 'e').where('e.id=:id', { id }).getOne();
    }
}
