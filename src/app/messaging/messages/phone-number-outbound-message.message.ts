export enum PhoneNumberContactMethod {
    VOICE_CALL = 'VOICE_CALL',
    SMS = 'SMS',
}

export class PhoneNumberOutboundMessage {
    phoneNumber: string;
    deliveryMethod: PhoneNumberContactMethod;
    message: string;
}
