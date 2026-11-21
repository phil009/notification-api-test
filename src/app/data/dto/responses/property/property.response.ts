import { Type } from 'class-transformer';
import { Property } from '../../../entities/external/property/property.entity';
import { NotificationApiAddressApiResponse } from '../address/address.response';
import { NotificationApiPropertyPortfolioApiResponse } from './property-portfolio.response';

export class NotificationApiPropertyApiResponse {
    id: string;
    version: number;
    name: string;
    @Type(() => Date)
    createdAt: Date;
    createdBy: string;

    @Type(() => NotificationApiPropertyApiResponse)
    supersets: NotificationApiPropertyApiResponse[];

    @Type(() => NotificationApiAddressApiResponse)
    address: NotificationApiAddressApiResponse;
    @Type(() => NotificationApiPropertyPortfolioApiResponse)
    portfolio: NotificationApiPropertyPortfolioApiResponse;

    workspaceId: string;

    static fromEntity(entity: Property) {
        const response = new NotificationApiPropertyApiResponse();
        response.id = entity.id;
        response.version = entity.audit.version;
        response.workspaceId = entity.workspace?.id;
        response.name = entity.name;
        if (entity.resolvedSupersets) {
            response.supersets = entity.resolvedSupersets?.map(NotificationApiPropertyApiResponse.fromEntity);
        }
        if (entity.address) {
            response.address = NotificationApiAddressApiResponse.fromEntity(entity.address);
        }
        if (entity.owner) {
            response.portfolio = NotificationApiPropertyPortfolioApiResponse.fromEntity(entity.owner);
        }
        response.createdAt = entity.audit.createdAt;
        response.createdBy = entity.audit.createdBy;
        return response;
    }
}
