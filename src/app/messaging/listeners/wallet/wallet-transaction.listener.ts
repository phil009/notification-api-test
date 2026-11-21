// import { Injectable } from '@matchmakerjs/di';
// import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
// import { Activity } from '@matchmakerjs/typeorm-audit';
// import { EntityManager } from 'typeorm';
// import { WalletTransactionApiResponse, WalletTransactionApiResponseStatusEnum } from '../../../../sdk/payment-api-sdk';
// import { WALLET_TRANSACTION_TOPIC } from '../../../constants/topics.constant';
// import { WalletTransaction } from '../../../data/entities/external/payment/wallet-transaction.entity';
// import { WalletTransactionService } from '../../services/wallet/wallet-transaction.service';

// @Injectable()
// export class WalletTransactionMessageListener implements MessageListener {
//     constructor(private walletTransactionService: WalletTransactionService, private entityManager: EntityManager) {}

//     @Activity('PROCESS WALLET TRANSACTION NOTIFICATION')
//     async processMessage(message: Buffer): Promise<void> {
//         const dto: WalletTransactionApiResponse = JSON.parse(message.toString());

//         const entity = await this.entityManager.getRepository(WalletTransaction).findOne(dto.id.toString(), {
//             relations: ['notification'],
//         });

//         if (!entity) {
//             if (dto.status !== WalletTransactionApiResponseStatusEnum.Successful) {
//                 return;
//             }
//             await this.walletTransactionService.create(dto);
//         } else if (entity.audit.version <= dto.version) {
//             await this.walletTransactionService.update(entity, dto);
//         }
//     }

//     getTopic(): string {
//         return WALLET_TRANSACTION_TOPIC;
//     }
// }
