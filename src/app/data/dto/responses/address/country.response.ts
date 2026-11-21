import { Country } from '../../../entities/external/location/country.entity';

export class CountryApiResponse {
    id: string;
    version: number;
    code: string;
    name: string;

    static fromEntity(entity: Country) {
        const response = new CountryApiResponse();
        response.id = entity.id;
        response.version = entity.audit.version;
        response.name = entity.name;
        response.code = entity.code;
        return response;
    }
}
