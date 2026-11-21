import { Type } from 'class-transformer';
import { PropertyOwner } from '../../../entities/external/property/property-owner.entity';

export class NotificationApiPropertyPortfolioApiResponse {
    id: string;
    version: number;
    displayName: string;
    @Type(() => Date)
    createdAt: Date;
    createdBy: string;

    workspaceId: string;

    static fromEntity(entity: PropertyOwner) {
        const response = new NotificationApiPropertyPortfolioApiResponse();
        response.id = entity.id;
        response.version = entity.audit.version;
        response.displayName = entity.displayName;
        response.createdAt = entity.audit.createdAt;
        response.createdBy = entity.audit.createdBy;
        response.workspaceId = entity.workspace?.id;
        return response;
    }
}
