// import { Injectable } from '@matchmakerjs/di';
// import { Transactional } from '@matchmakerjs/typeorm-audit';
// import { EntityManager } from 'typeorm';
// import {
//     PaymentApiCustomerApiResponse,
//     PaymentApiCustomerApiResponseTypeEnum,
//     WalletTransactionApiResponse,
//     WalletTransactionApiResponseSourceEnum,
//     WalletTransactionApiResponseStatusEnum,
// } from '../../../../sdk/payment-api-sdk';
// import { NotificationDao } from '../../../dao/notification.dao';
// import { WalletTransaction } from '../../../data/entities/external/payment/wallet-transaction.entity';
// import { Wallet } from '../../../data/entities/external/payment/wallet.entity';
// import { Notification } from '../../../data/entities/notification.entity';
// import { NotificationType } from '../../../data/enums/notification-type.enum';
// import { NotificationTargetService } from '../../../services/notification-target.service';

// @Injectable()
// export class WalletTransactionService {
//     constructor(
//         private entityManager: EntityManager,
//         private notificationDao: NotificationDao,
//         private notificationRecipientService: NotificationTargetService,
//     ) {}

//     @Transactional()
//     async create(data: WalletTransactionApiResponse): Promise<WalletTransaction> {
//         const entity = new WalletTransaction();
//         entity.id = data.id.toString();
//         await this.update(entity, data);
//         return entity;
//     }

//     @Transactional()
//     async update(entity: WalletTransaction, message: WalletTransactionApiResponse): Promise<WalletTransaction> {
//         const wallet = new Wallet();
//         wallet.id = message.walletId;

//         entity.wallet = wallet;
//         entity.currency = message.currency;
//         entity.amount = message.amount;
//         entity.walletBalanceAtStart = message.walletBalanceAtStart;
//         entity.source = message.source;
//         entity.type = message.type;
//         entity.status = message.status;

//         entity.audit.version = message.version;
//         entity.audit.createdBy = message.createdBy;
//         entity.audit.createdAt = message.createdAt && new Date(message.createdAt);
//         entity.audit.receivedAt = new Date();
//         if (
//             !entity.notification &&
//             // message.payment?.walletIdentifier &&
//             entity.source === WalletTransactionApiResponseSourceEnum.TopUp &&
//             entity.status === WalletTransactionApiResponseStatusEnum.Successful
//         ) {
//             entity.notification = await this.createNotification(entity, message.wallet.customer);
//         }
//         await this.entityManager.save(entity);
//         return entity;
//     }

//     private async createNotification(walletTransaction: WalletTransaction, customer: PaymentApiCustomerApiResponse) {
//         const notification = await this.notificationDao.findNotificationBySource({
//             type: NotificationType.WALLET_TOP_UP,
//             sourceReference: walletTransaction.id,
//         });
//         if (notification) {
//             walletTransaction.notification = notification;
//             return notification;
//         }

//         const numberFormat = new Intl.NumberFormat('en-us', {
//             minimumFractionDigits: 2,
//             currency: walletTransaction.currency,
//         });

//         const entity = new Notification();
//         entity.title = `${walletTransaction.currency}${numberFormat.format(
//             walletTransaction.amount,
//         )} added to your wallet`;
//         entity.type = NotificationType.WALLET_TOP_UP;
//         entity.sourceReference = walletTransaction.id;
//         await this.entityManager.save(entity);

//         if (customer.type === PaymentApiCustomerApiResponseTypeEnum.User) {
//             await this.notificationRecipientService.createForUser(entity, customer.reference);
//         }
//         return entity;
//     }
// }
