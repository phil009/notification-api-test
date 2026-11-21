import { PropertyUnitTenure } from '../../../entities/external/tenure/property-unit-tenure.entity';
import { NotificationApiPropertyUnitApiResponse } from './property-unit.response';

export class NotificationApiTenureApiResponse {
    id: string;
    version: number;
    startedAt: Date;
    endedAt: Date;
    createdAt: Date;
    isStartingTenure: boolean;
    propertyUnit: NotificationApiPropertyUnitApiResponse;

    static fromEntity(entity: PropertyUnitTenure) {
        const response = new NotificationApiTenureApiResponse();
        response.id = entity.id;
        response.version = entity.audit.version;
        response.startedAt = entity.startedAt;
        response.endedAt = entity.endedAt;
        response.createdAt = entity.audit.createdAt;
        if (entity.propertyUnit) {
            response.propertyUnit = NotificationApiPropertyUnitApiResponse.fromEntity(entity.propertyUnit);
        }
        return response;
    }
}
