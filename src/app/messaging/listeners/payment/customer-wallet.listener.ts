import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { CUSTOMER_WALLET_TOPIC } from '../../../constants/topics.constant';
import { CustomerWallet } from '../../../data/entities/external/payment/customer-wallet.entity';
import { CustomerWalletMessage } from '../../messages/customer-wallet.message';
import { CustomerWalletService } from '../../services/payment/customer-wallet.service';

@Injectable()
export class CustomerWalletMessageListener implements MessageListener {
    constructor(private entityManager: EntityManager, private customerWalletService: CustomerWalletService) { }

    @Activity('CUSTOMER WALLET NOTIFICATION')
    async processMessage(message: Buffer): Promise<void> {
        const dto: CustomerWalletMessage = JSON.parse(message.toString());

        const entity = await this.entityManager.getRepository(CustomerWallet).findOne(dto.id.toString());

        if (!entity) {
            await this.customerWalletService.create(dto);
        } else if (entity.audit.version <= dto.version) {
            await this.customerWalletService.update(entity, dto);
        }
    }

    getTopic(): string {
        return CUSTOMER_WALLET_TOPIC;
    }
}
