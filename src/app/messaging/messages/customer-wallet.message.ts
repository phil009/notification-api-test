import { PaymentApiCustomerApiResponse, WalletApiResponse } from '../../../sdk/payment-api-sdk';

export class CustomerWalletMessage {
    id: string;
    version: number;
    createdAt: string;
    createdBy: string;
    deactivatedAt: string;
    deactivatedBy: string;

    customer: PaymentApiCustomerApiResponse;
    wallet: WalletApiResponse;
}
