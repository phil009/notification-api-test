import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { Country } from '../../../data/entities/external/location/country.entity';
import { State } from '../../../data/entities/external/location/state.entity';
import { LocationMessage, LocationType } from '../../messages/location.message';

@Injectable()
export class StateService {
    constructor(private entityManager: EntityManager) {}

    @Transactional()
    async createState(data: LocationMessage): Promise<State> {
        const entity = new State();
        entity.id = data.id;
        await this.updateState(entity, data);
        return entity;
    }

    @Transactional()
    async updateState(entity: State, data: LocationMessage): Promise<void> {
        const countries = data.parents?.filter((it) => it.type === LocationType.COUNTRY);
        if (countries?.length === 1) {
            const country = new Country();
            country.id = countries[0].id;
            entity.country = country;
        } else {
            throw new Error(`Country missing for state ${data.code}`);
        }

        entity.name = data.name;
        entity.code = data.code;

        entity.audit.version = data.version;
        await this.entityManager.save(entity);
    }
}
