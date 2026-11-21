import { Type } from 'class-transformer';
import { PropertyUnitSubscriptionPayment } from '../../../entities/external/ledger/property-unit/property-unit-subscription-payment.entity';
import { NotificationApiPropertyPortfolioApiResponse } from './property-portfolio.response';

export class NotificationApiPropertyUnitSubscriptionPaymentApiResponse {
    id: string;
    version: number;
    amount: number;

    // @Type(() => PropertyUnitSubscriptionLedgerApiResponse)
    // propertyUnitSubscriptionLedger: PropertyUnitSubscriptionLedgerApiResponse;

    @Type(() => NotificationApiPropertyPortfolioApiResponse)
    propertyOwner: NotificationApiPropertyPortfolioApiResponse;

    createdAt: Date;
    @Type(() => Date)
    deactivatedAt: Date;

    static fromEntity(entity: PropertyUnitSubscriptionPayment) {
        const response = new NotificationApiPropertyUnitSubscriptionPaymentApiResponse();
        response.id = entity.id;
        response.version = entity.audit.version;
        response.amount = entity.amount;

        response.createdAt = entity.audit.createdAt;
        response.deactivatedAt = entity.audit.deactivatedAt;

        // if (entity.propertyUnitSubscriptionLedger) {
        //     response.propertyUnitSubscriptionLedger = PropertyUnitSubscriptionLedgerApiResponse.fromEntity(
        //         entity.propertyUnitSubscriptionLedger,
        //     );
        // }

        if (entity.propertyUnitSubscriptionLedger?.propertyOwner) {
            response.propertyOwner = NotificationApiPropertyPortfolioApiResponse.fromEntity(
                entity.propertyUnitSubscriptionLedger.propertyOwner,
            );
        }

        return response;
    }
}
