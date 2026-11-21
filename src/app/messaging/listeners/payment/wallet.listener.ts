import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { WalletApiResponse } from '../../../../sdk/payment-api-sdk';
import { WALLET_TOPIC } from '../../../constants/topics.constant';
import { Wallet } from '../../../data/entities/external/payment/wallet.entity';
import { WalletService } from '../../services/payment/wallet.service';

@Injectable()
export class WalletMessageListener implements MessageListener {
    constructor(private entityManager: EntityManager, private walletService: WalletService) {}

    @Activity('WALLET NOTIFICATION')
    async processMessage(message: Buffer): Promise<void> {
        const dto: WalletApiResponse = JSON.parse(message.toString());

        const entity = await this.entityManager.getRepository(Wallet).findOne(dto.id.toString());

        if (!entity) {
            await this.walletService.create(dto);
        } else if (entity.audit.version <= dto.version) {
            await this.walletService.update(entity, dto);
        }
    }

    getTopic(): string {
        return WALLET_TOPIC;
    }
}
