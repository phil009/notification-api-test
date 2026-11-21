import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { Country } from '../../../data/entities/external/location/country.entity';
import { LocationMessage } from '../../messages/location.message';

@Injectable()
export class CountryService {
    constructor(private entityManager: EntityManager) {}

    @Transactional()
    async createCountry(data: LocationMessage): Promise<Country> {
        const entity = new Country();
        entity.id = data.id;
        await this.updateCountry(entity, data);
        return entity;
    }

    @Transactional()
    async updateCountry(entity: Country, data: LocationMessage): Promise<void> {
        entity.name = data.name;
        entity.code = data.code;

        entity.audit.version = data.version;
        await this.entityManager.save(entity);
    }
}
