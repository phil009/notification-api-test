import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity } from '@matchmakerjs/typeorm-audit';
import { SplitPaymentApiResponse } from '../../../../sdk/payment-api-sdk';
import { SPLIT_PAYMENT_TOPIC } from '../../../constants/topics.constant';
import { SplitPaymentDao } from '../../../dao/split-payment.dao';
import { SplitPaymentService } from '../../services/payment/split-payment.service';

@Injectable()
export class SplitPaymentMessageListener implements MessageListener {
    constructor(private splitPaymentService: SplitPaymentService, private splitPaymentDao: SplitPaymentDao) {}

    @Activity('PROCESS SPLIT PAYMENT NOTIFICATION')
    async processMessage(message: Buffer): Promise<void> {
        const dto: SplitPaymentApiResponse = JSON.parse(message.toString());
        const entity = await this.splitPaymentDao.getById(dto.id);
        if (!entity) {
            await this.splitPaymentService.create(dto);
        } else if (entity.audit.version <= dto.version) {
            await this.splitPaymentService.update(entity, dto);
        }
    }

    getTopic(): string {
        return SPLIT_PAYMENT_TOPIC;
    }
}
