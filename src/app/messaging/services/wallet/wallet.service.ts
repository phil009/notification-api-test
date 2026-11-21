// import { Injectable } from '@matchmakerjs/di';
// import { Transactional } from '@matchmakerjs/typeorm-audit';
// import { EntityManager } from 'typeorm';
// import { PaymentApiCustomerApiResponseTypeEnum, WalletApiResponse } from '../../../../sdk/payment-api-sdk';
// import { Wallet } from '../../../data/entities/external/payment/wallet.entity';
// import { PortalUser } from '../../../data/entities/external/portal-user.entity';

// @Injectable()
// export class WalletService {
//     constructor(private entityManager: EntityManager) {}

//     @Transactional()
//     async create(data: WalletApiResponse): Promise<Wallet> {
//         const entity = new Wallet();
//         entity.id = data.id.toString();
//         await this.update(entity, data);
//         return entity;
//     }

//     @Transactional()
//     async update(entity: Wallet, data: WalletApiResponse): Promise<void> {
//         entity.currency = data.currency;
//         entity.balance = data.balance;
//         entity.balanceLastUpdatedAt = data.balanceLastUpdatedAt && new Date(data.balanceLastUpdatedAt);
//         entity.sumOfQueuedDebitTransactions = data.sumOfQueuedDebitTransactions;
//         entity.isFreeCredit = !!data.freeCredit;
//         entity.expiresAt = data.expiresAt && new Date(data.expiresAt);

//         if (data.customer.type === PaymentApiCustomerApiResponseTypeEnum.User) {
//             const portalUser = new PortalUser();
//             portalUser.userId = data.customer.reference;
//             entity.portalUser = portalUser;
//         }

//         entity.audit.version = data.version;

//         await this.entityManager.save(entity);
//     }
// }
