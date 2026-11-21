import { PasswordResetCodeMessageListener } from './app/messaging/listeners/auth/password-reset-code.listener';
import { UserAccountDeletionRequestMessageListener } from './app/messaging/listeners/auth/user-account-deletion-confirmation-code.listener';
import { UserIdentifierVerificationCodeMessageListener } from './app/messaging/listeners/auth/user-identifier-verification-code.listener';
import { ElectricityMeterProviderMessageListener } from './app/messaging/listeners/electricity/electricity-meter-provider.listener';
import { ElectricityMeterMessageListener } from './app/messaging/listeners/electricity/electricity-meter.listener';
import { ElectricityUnitPurchaseMessageListener } from './app/messaging/listeners/electricity/electricity-unit-purchase.listener';
import { OfflinePaymentMessageListener } from './app/messaging/listeners/ledger/offline-payment.listener';
import { PropertyUnitSubscriptionLedgerEntryMessageListener } from './app/messaging/listeners/ledger/property-unit-subscription-ledger-entry.listener';
import { PropertyUnitSubscriptionPaymentMessageListener } from './app/messaging/listeners/ledger/property-unit-subscription-payment.listener';
import { TenureLedgerEntryMessageListener } from './app/messaging/listeners/ledger/tenure-ledger-entry.listener';
import { PropertyUnitTenurePaymentMessageListener } from './app/messaging/listeners/ledger/tenure-payment.listener';
import { LocationMessageListener } from './app/messaging/listeners/location/location.listener';
import { CustomerWalletMessageListener } from './app/messaging/listeners/payment/customer-wallet.listener';
import { CustomerMessageListener } from './app/messaging/listeners/payment/customer.listener';
import { SplitPaymentMessageListener } from './app/messaging/listeners/payment/split-payment.listener';
import { WalletTransactionMessageListener } from './app/messaging/listeners/payment/wallet-transaction.listener';
import { WalletMessageListener } from './app/messaging/listeners/payment/wallet.listener';
import { PhoneCallRequestMessageListener } from './app/messaging/listeners/phone-call-request.listener';
import { PhoneNumberOutboundMessageListener } from './app/messaging/listeners/phone-number-outbound-message.listener';
import { PropertyOwnerMessageListener } from './app/messaging/listeners/property/property-owner.listener';
import { PropertyUnitMessageListener } from './app/messaging/listeners/property/property-unit.listener';
import { PropertyMessageListener } from './app/messaging/listeners/property/property.listener';
import { PropertyUnitOccupantMessageListener } from './app/messaging/listeners/tenure/property-unit-occupant.listener';
import { PropertyUnitTenureMessageListener } from './app/messaging/listeners/tenure/property-unit-tenure.listener';
import { PortalUserMessageListener } from './app/messaging/listeners/user/portal-user.listener';
import { UserSessionMessageListener } from './app/messaging/listeners/user/user-session.listener';
import { RoleMessageListener } from './app/messaging/listeners/workspace/role.listener';
import { WorkspaceContactDetailVerificationCodeMessageListener } from './app/messaging/listeners/workspace/workspace-contact-detail-verification-code.listener';
import { WorkspaceMemberMessageListener } from './app/messaging/listeners/workspace/workspace-member.listener';
import { WorkspaceMessageListener } from './app/messaging/listeners/workspace/workspace.listener';

export const listeners = [
    LocationMessageListener,
    PortalUserMessageListener,
    UserIdentifierVerificationCodeMessageListener,
    UserSessionMessageListener,
    PasswordResetCodeMessageListener,
    UserAccountDeletionRequestMessageListener,
    CustomerMessageListener,
    CustomerWalletMessageListener,
    WalletMessageListener,
    WalletTransactionMessageListener,
    SplitPaymentMessageListener,
    ElectricityMeterProviderMessageListener,
    ElectricityMeterMessageListener,
    ElectricityUnitPurchaseMessageListener,
    PhoneCallRequestMessageListener,
    PhoneNumberOutboundMessageListener,
    WorkspaceMessageListener,
    WorkspaceMemberMessageListener,
    RoleMessageListener,
    PropertyOwnerMessageListener,
    PropertyMessageListener,
    PropertyUnitMessageListener,
    PropertyUnitTenureMessageListener,
    PropertyUnitOccupantMessageListener,
    PropertyUnitSubscriptionLedgerEntryMessageListener,
    PropertyUnitSubscriptionPaymentMessageListener,
    TenureLedgerEntryMessageListener,
    PropertyUnitTenurePaymentMessageListener,
    WorkspaceContactDetailVerificationCodeMessageListener,
    OfflinePaymentMessageListener,
];
