import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity, Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { PropertyUnitSubscriptionPaymentApiResponse } from '../../../../sdk/ledger-api-sdk';
import { PROPERTY_UNIT_SUBSCRIPTION_PAYMENT_TOPIC } from '../../../constants/topics.constant';
import { PropertyUnitSubscriptionPayment } from '../../../data/entities/external/ledger/property-unit/property-unit-subscription-payment.entity';
import { PropertyUnitSubscriptionPaymentService } from '../../services/ledger/property-unit-subscription-payment.service';

@Injectable()
export class PropertyUnitSubscriptionPaymentMessageListener implements MessageListener {
    constructor(
        private entityManager: EntityManager,
        private propertyUnitSubscriptionPaymentService: PropertyUnitSubscriptionPaymentService,
    ) {}

    @Activity('PROPERTY UNIT SUBSCRIPTION PAYMENT NOTIFICATION')
    @Transactional()
    async processMessage(message: Buffer): Promise<void> {
        const dto: PropertyUnitSubscriptionPaymentApiResponse = JSON.parse(message.toString());

        const subscriptionPayment = await this.entityManager.getRepository(PropertyUnitSubscriptionPayment).findOne({
            withDeleted: true,
            where: { id: dto.id },
        });
        if (!subscriptionPayment) {
            await this.propertyUnitSubscriptionPaymentService.create(dto);
        } else {
            await this.propertyUnitSubscriptionPaymentService.update(subscriptionPayment, dto);
        }
    }

    getTopic(): string {
        return PROPERTY_UNIT_SUBSCRIPTION_PAYMENT_TOPIC;
    }
}
