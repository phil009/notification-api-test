import { randomUUID } from 'crypto';
import * as faker from 'faker';
import { EntityManager } from 'typeorm';
import { Country } from '../../src/app/data/entities/external/location/country.entity';
import { State } from '../../src/app/data/entities/external/location/state.entity';
import { createCountry } from './country.seeder';

export const createState = async ({ entityManager, country }: { entityManager: EntityManager; country?: Country }) => {
    const entity = new State();
    entity.country = country || (await createCountry({ entityManager }));
    entity.id = randomUUID();
    entity.name = faker.address.state();
    entity.code = faker.address.stateAbbr();
    return entityManager.save(entity);
};
