import { Type } from 'class-transformer';
import { OfflinePaymentApiResponseStatusEnum } from '../../../../../sdk/ledger-api-sdk';
import { OfflinePayment } from '../../../entities/external/ledger/offline-payment.entity';
import { NotificationApiWorkspaceApiResponse } from '../workspace.response';

export class NotificationApiOfflinePaymentApiResponse {
    id: string;
    version: number;
    workspaceId: string;
    currency: string;
    amount: number;
    payerName: string;
    paymentDate: string;
    paymentChannel: string;
    paymentReference: string;
    comment: string;

    createdBy: string;
    @Type(() => Date)
    createdAt: Date;
    @Type(() => Date)
    reviewedAt: Date;
    reasonForRejection: string;
    status: OfflinePaymentApiResponseStatusEnum;

    workspace: NotificationApiWorkspaceApiResponse;

    static fromEntity(entity: OfflinePayment) {
        const response = NotificationApiOfflinePaymentApiResponse.buildResponse(entity);
        return response;
    }

    private static buildResponse(entity: OfflinePayment) {
        const response = new NotificationApiOfflinePaymentApiResponse();
        response.id = entity.id;
        response.version = entity.audit.version;
        response.workspaceId = entity.workspace?.id;
        response.currency = entity.currency;
        response.amount = entity.amount;
        response.payerName = entity.payerName;
        response.paymentDate = entity.paymentDate;
        response.paymentChannel = entity.paymentChannel;
        response.paymentReference = entity.paymentReference;
        response.comment = entity.comment;

        response.createdBy = entity.audit.createdBy;
        response.createdAt = entity.audit.createdAt;
        response.reviewedAt = entity.reviewedAt;
        response.reasonForRejection = entity.reasonForRejection;
        response.status = entity.status;
        return response;
    }
}
