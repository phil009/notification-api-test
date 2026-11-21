import { State } from '../../../entities/external/location/state.entity';
import { CountryApiResponse } from './country.response';

export class StateApiResponse {
    id: string;
    version: number;
    code: string;
    name: string;
    country: CountryApiResponse;

    static fromEntity(entity: State) {
        const response = new StateApiResponse();
        response.id = entity.id;
        response.version = entity.audit.version;
        response.name = entity.name;
        response.code = entity.code;
        if (entity.country) {
            response.country = CountryApiResponse.fromEntity(entity.country);
        }
        return response;
    }
}
