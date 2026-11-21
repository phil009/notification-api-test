import { Type } from 'class-transformer';
import { PropertyUnit } from '../../../entities/external/property/property-unit.entity';
import { NotificationApiAddressApiResponse } from '../address/address.response';
import { NotificationApiPropertyPortfolioApiResponse } from './property-portfolio.response';
import { NotificationApiPropertyApiResponse } from './property.response';

export class NotificationApiPropertyUnitApiResponse {
    id: string;
    version: number;
    unitNumber: string;
    referenceCode: string;

    @Type(() => NotificationApiPropertyApiResponse)
    location: NotificationApiPropertyApiResponse[];

    @Type(() => NotificationApiPropertyApiResponse)
    property: NotificationApiPropertyApiResponse;

    @Type(() => NotificationApiAddressApiResponse)
    address: NotificationApiAddressApiResponse;
    
    @Type(() => NotificationApiPropertyPortfolioApiResponse)
    portfolio: NotificationApiPropertyPortfolioApiResponse;

    static fromEntity(entity: PropertyUnit) {
        const response = new NotificationApiPropertyUnitApiResponse();
        response.id = entity.id;
        response.unitNumber = entity.unitNumber;
        response.referenceCode = entity.referenceCode;
        if (entity.location) {
            response.location = [entity.location, ...(entity.location?.resolvedSupersets || [])].map(
                NotificationApiPropertyApiResponse.fromEntity,
            );
            response.property = NotificationApiPropertyApiResponse.fromEntity(entity.location);
            response.portfolio = response.property.portfolio || response.property?.supersets.at(-1)?.portfolio;
            response.address = response.property.address || response.property?.supersets.at(-1)?.address;
        }
        return response;
    }
}
