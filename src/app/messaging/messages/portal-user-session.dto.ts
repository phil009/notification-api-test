import { Type } from 'class-transformer';
import { NameValuePair } from '../../../sdk/auth-api-sdk';

export class PortalUserSessionDto {
    userId: string;
    sessionId: string;
    identifier: string;

    @Type(() => Date)
    startedAt: Date;
    @Type(() => Date)
    lastSeenAt: Date;
    @Type(() => Date)
    lastActiveAt: Date;
    @Type(() => Date)
    expiresAt: Date;
    @Type(() => Date)
    lastUpdatedAt: Date;
    @Type(() => Date)
    deactivatedAt: Date;

    authenticationType: string;

    data: NameValuePair[];
}
