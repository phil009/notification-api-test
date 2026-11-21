import { Type } from 'class-transformer';
import { UserNotification } from '../../entities/notification.entity';
import { NotificationType } from '../../enums/notification-type.enum';
import { NotificationApiOfflinePaymentApiResponse } from './ledger/offline-payment.response';
import { NotificationApiWalletTransactionApiResponse } from './payment/wallet-transaction.response';

export class NotificationApiResponse {
    id: string;
    version: number;
    title: string;
    message: string;
    type: NotificationType;

    @Type(() => Date)
    createdAt: Date;

    @Type(() => NotificationApiWalletTransactionApiResponse)
    walletTransaction: NotificationApiWalletTransactionApiResponse;

    // @Type(() => TenureServiceChargeApiResponse)
    // tenureServiceCharge: TenureServiceChargeApiResponse;

    // @Type(() => NotificationApiElectricityUnitPurchaseApiResponse)
    // electricityUnitPurchase: NotificationApiElectricityUnitPurchaseApiResponse;

    @Type(() => NotificationApiOfflinePaymentApiResponse)
    offlinePayment: NotificationApiOfflinePaymentApiResponse;

    viewed: boolean;

    static fromEntity(entity: UserNotification) {
        const response = new NotificationApiResponse();
        response.id = entity.id;
        response.version = entity.version;
        response.type = entity.type;
        response.title = entity.title;
        response.message = entity.message;
        response.createdAt = entity.audit.createdAt;

        if (entity.walletTransaction) {
            response.walletTransaction = NotificationApiWalletTransactionApiResponse.fromEntity(
                entity.walletTransaction,
            );
        }
        // if (entity.tenureServiceCharge) {
        //     response.tenureServiceCharge = TenureServiceChargeApiResponse.fromEntity(entity.tenureServiceCharge);
        // }
        // if (entity.electricityUnitPurchase) {
        //     response.electricityUnitPurchase = NotificationApiElectricityUnitPurchaseApiResponse.fromEntity(
        //         entity.electricityUnitPurchase,
        //     );
        // }
        if (entity.offlinePayment) {
            response.offlinePayment = NotificationApiOfflinePaymentApiResponse.fromEntity(entity.offlinePayment);
        }

        response.viewed = !!entity.firstViewedAt;

        return response;
    }
}
