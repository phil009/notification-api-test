import { Type } from 'class-transformer';
import { ElectricityUnitPurchase } from '../../../entities/external/electricity/electricity-unit-purchase.entity';
import { NotificationApiElectricityMeterApiResponse } from './electricity-meter.response';

export class NotificationApiElectricityUnitPurchaseApiResponse {
    id: string;
    version: number;
    requestReference: string;

    phoneNumber: string;

    currency: string;
    amount: number;
    serviceCharge: number;

    status: string;
    failureType: string;

    startedAt: Date;
    endedAt: Date;

    serviceToken: string;
    allocatedUnits: string;
    serviceAmount: number;
    vat: number;
    debt: number;

    transactionAmount: number;
    walletBalance: number;

    walletTransactionId: string;

    @Type(() => NotificationApiElectricityMeterApiResponse)
    meter: NotificationApiElectricityMeterApiResponse;

    createdBy: string;
    @Type(() => Date)
    createdAt: Date;

    static fromEntity(entity: ElectricityUnitPurchase) {
        const response = new NotificationApiElectricityUnitPurchaseApiResponse();
        response.id = entity.id;
        response.version = entity.audit.version;
        response.requestReference = entity.requestReference;

        response.phoneNumber = entity.phoneNumber;
        response.currency = entity.currency;
        response.amount = entity.amount;
        response.serviceCharge = entity.serviceCharge;

        response.status = entity.status;
        response.failureType = entity.failureType;
        response.startedAt = entity.startedAt;
        response.endedAt = entity.endedAt;

        response.serviceToken = entity.serviceToken;
        response.allocatedUnits = entity.allocatedUnits;
        response.serviceAmount = entity.serviceAmount;
        response.vat = entity.vat;
        response.debt = entity.debt;

        if (entity.walletTransaction) {
            response.walletTransactionId = entity.walletTransaction.id;
            response.transactionAmount = entity.walletTransaction.amount;
        }
        if (entity.meter) {
            response.meter = NotificationApiElectricityMeterApiResponse.fromEntity(entity.meter);
        }

        response.createdBy = entity.audit.createdBy;
        response.createdAt = entity.audit.createdAt;
        return response;
    }
}
