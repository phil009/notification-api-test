import { OccupantApiResponseTypeEnum } from '../../../../../sdk/occupant-api-sdk';
import { PropertyUnitOccupant } from '../../../entities/external/tenure/property-unit-occupant.entity';
import { NotificationApiTenureApiResponse } from './property-unit-tenure.response';

export class NotificationApiOccupantApiResponse {
    id: string;
    version: number;
    userId: string;
    title?: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    emailAddress?: string;
    tenure: NotificationApiTenureApiResponse;
    type: OccupantApiResponseTypeEnum;

    static fromEntity(entity: PropertyUnitOccupant) {
        const response = new NotificationApiOccupantApiResponse();
        response.id = entity.id;
        response.version = entity.audit.version;
        response.userId = entity.user?.userId;
        response.title = entity.title;
        response.firstName = entity.firstName;
        response.lastName = entity.lastName;
        response.phoneNumber = entity.phoneNumber;
        response.emailAddress = entity.emailAddress;
        response.type = entity.type;
        if (entity.tenure) {
            response.tenure = NotificationApiTenureApiResponse.fromEntity(entity.tenure);
        }
        return response;
    }
}
