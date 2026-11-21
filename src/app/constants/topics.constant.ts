export const USER_ACCOUNT_TOPIC = 'user_account';
export const USER_SESSION_TOPIC = 'user_session';

export const USER_IDENTIFIER_VERIFICATION_CODE_REQUEST_TOPIC =
    process.env.USER_IDENTIFIER_VERIFICATION_CODE_REQUEST || 'user_identifier_verification_code_request';
export const PASSWORD_RESET_CODE_TOPIC = process.env.PASSWORD_RESET_CODE || 'password_reset_code';
export const USER_ACCOUNT_DELETION_REQUEST_TOPIC =
    process.env.USER_ACCOUNT_DELETION_REQUEST_TOPIC || 'user_account_deletion_request';

export const CUSTOMER_TOPIC = 'customer';
export const CUSTOMER_WALLET_TOPIC = 'customer_wallet';
export const WALLET_TOPIC = 'wallet';
export const WALLET_TRANSACTION_TOPIC = 'wallet_transaction';
export const SPLIT_PAYMENT_TOPIC = 'split_payment';
export const OFFLINE_PAYMENT_TOPIC = 'offline_payment';

export const LOCATION_TOPIC = 'location';

export const PROPERTY_OWNER_TOPIC = 'property_owner';
export const PLACE_TOPIC = 'place';
export const PROPERTY_UNIT_TOPIC = 'property_unit';
export const PROPERTY_UNIT_TENURE_TOPIC = 'property_unit_tenure';
export const PROPERTY_UNIT_OCCUPANT_TOPIC = 'property_unit_occupant';
export const PROPERTY_UNIT_FEE_TOPIC = 'property_unit_fee';

export const RBAC_WORKSPACE_TOPIC = 'rbac_workspace';
export const ROLE_TOPIC = process.env.ROLE_TOPIC || 'role';
export const WORKSPACE_MEMBER_TOPIC = process.env.WORKSPACE_MEMBER || 'workspace_member';
export const WORKSPACE_CONTACT_DETAIL_VERIFICATION_REQUEST_TOPIC =
    process.env.WORKSPACE_CONTACT_DETAIL_VERIFICATION_REQUEST_TOPIC || 'workspace_contact_detail_verification_request';

export const TENURE_LEDGER_ENTRY_TOPIC = 'tenure_ledger_entry';
export const TENURE_PAYMENT_TOPIC = 'tenure_payment';

export const PROPERTY_UNIT_SUBSCRIPTION_LEDGER_ENTRY_TOPIC = 'property_unit_subscription_ledger_entry';
export const PROPERTY_UNIT_SUBSCRIPTION_PAYMENT_TOPIC = 'property_unit_subscription_payment';

export const ELECTRICITY_METER_PROVIDER_TOPIC = 'electricity_meter_provider';
export const ELECTRICITY_METER_TOPIC = 'electricity_meter';
export const ELECTRICITY_UNIT_PURCHASE_TOPIC = 'electricity_unit_purchase';

export const PHONE_CALL_TOPIC = 'phone_call';
export const PHONE_NUMBER_OUTBOUND_MESSAGE_TOPIC = 'phone_number_outbound_message';
