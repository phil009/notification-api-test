export class ExternalPortalUserIdentifierVerificationCodeMessage {
    referenceId: string;
    identifierType: string;
    identifier: string;

    verificationCode?: string;
    expiresAt?: Date;
}
