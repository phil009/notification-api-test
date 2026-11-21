import { Address } from '../../../entities/address.entity';
import { LgaApiResponse } from './lga.response';

export class NotificationApiAddressApiResponse {
    id: number;
    version: number;
    streetAddress: string;
    city: string;
    lga: LgaApiResponse;

    static fromEntity(entity: Address) {
        const response = new NotificationApiAddressApiResponse();
        response.id = entity.id;
        response.streetAddress = entity.streetAddress;
        response.city = entity.city;
        if (entity.lga) {
            response.lga = LgaApiResponse.fromEntity(entity.lga);
        }
        return response;
    }
}
