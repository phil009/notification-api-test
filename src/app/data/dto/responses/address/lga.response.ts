import { Lga } from '../../../entities/external/location/lga.entity';
import { StateApiResponse } from './state.response';

export class LgaApiResponse {
    id: string;
    version: number;
    code: string;
    name: string;
    state: StateApiResponse;

    static fromEntity(entity: Lga) {
        const response = new LgaApiResponse();
        response.id = entity.id;
        response.version = entity.audit.version;
        response.name = entity.name;
        response.code = entity.code;
        if (entity.state) {
            response.state = StateApiResponse.fromEntity(entity.state);
        }
        return response;
    }
}
