export class PasswordResetCodeDto {
    userId: string;
    identifierType: string;
    identifier: string;

    resetCode: string;
    createdAt: string;
    expiresAt: string;
    requestHost: string;
    requestQuery: string;
}
