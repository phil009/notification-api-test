import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { PaymentApiCustomerApiResponse } from '../../../../sdk/payment-api-sdk';
import { CUSTOMER_TOPIC } from '../../../constants/topics.constant';
import { Customer } from '../../../data/entities/external/payment/customer.entity';
import { CustomerService } from '../../services/payment/customer.service';

@Injectable()
export class CustomerMessageListener implements MessageListener {
    constructor(private entityManager: EntityManager, private customerService: CustomerService) { }

    @Activity('CUSTOMER NOTIFICATION')
    async processMessage(message: Buffer): Promise<void> {
        const dto: PaymentApiCustomerApiResponse = JSON.parse(message.toString());
        if (dto.reference === 'PLATFORM_ADMIN') {
            return;
        }

        const entity = await this.entityManager.getRepository(Customer).findOne(dto.id.toString());

        if (!entity) {
            await this.customerService.create(dto);
        } else if (entity.audit.version <= dto.version) {
            await this.customerService.update(entity, dto);
        }
    }

    getTopic(): string {
        return CUSTOMER_TOPIC;
    }
}
