import { Type } from 'class-transformer';
import { WalletTransaction } from '../../../entities/external/payment/wallet-transaction.entity';
import { NotificationApiElectricityUnitPurchaseApiResponse } from '../electricity/electricity-unit-purchase.response';
import { NotificationApiPropertyUnitSubscriptionPaymentApiResponse } from '../property/property-unit-subscription-payment.response';

export class NotificationApiWalletTransactionApiResponse {
    id: string;
    version: number;
    walletId: string;
    currency: string;
    amount: number;
    source: string;
    type: string;
    status: string;
    walletBalanceAtStart: number;
    walletBalance: number;
    createdBy: string;
    @Type(() => Date)
    createdAt: Date;

    @Type(() => NotificationApiElectricityUnitPurchaseApiResponse)
    electricityUnitPurchase: NotificationApiElectricityUnitPurchaseApiResponse;

    @Type(() => NotificationApiPropertyUnitSubscriptionPaymentApiResponse)
    propertyUnitSubscriptionPayment: NotificationApiPropertyUnitSubscriptionPaymentApiResponse;

    // @Type(() => PropertyUnitRegistrationBillApiResponse)
    // propertyUnitRegistrationBill: PropertyUnitRegistrationBillApiResponse;

    static fromEntity(entity: WalletTransaction) {
        const response = new NotificationApiWalletTransactionApiResponse();
        response.id = entity.id;
        response.version = entity.audit.version;
        response.currency = entity.currency;
        response.amount = entity.amount;
        response.source = entity.source;
        response.type = entity.type;
        response.walletBalanceAtStart = entity.walletBalanceAtStart;
        response.status = entity.status;
        response.createdBy = entity.audit.createdBy;
        response.createdAt = entity.audit.createdAt;
        if (entity.electricityUnitPurchase) {
            response.electricityUnitPurchase = NotificationApiElectricityUnitPurchaseApiResponse.fromEntity(
                entity.electricityUnitPurchase,
            );
        }
        // if (entity.splitPayment?.propertyUnitRegistrationBill) {
        //     response.propertyUnitRegistrationBill = PropertyUnitRegistrationBillApiResponse.fromEntity(
        //         entity.splitPayment.propertyUnitRegistrationBill,
        //     );
        // }
        if (entity.splitPayment?.propertyUnitSubscriptionPayment) {
            response.propertyUnitSubscriptionPayment =
                NotificationApiPropertyUnitSubscriptionPaymentApiResponse.fromEntity(
                    entity.splitPayment.propertyUnitSubscriptionPayment,
                );
        }
        // if (entity.propertyUnitSubscriptionPayment) {
        //     response.propertyUnitSubscriptionPayment =
        //         NotificationApiPropertyUnitSubscriptionPaymentApiResponse.fromEntity(
        //             entity.propertyUnitSubscriptionPayment,
        //         );
        // }
        return response;
    }
}
