import { randomUUID } from 'crypto';
import * as faker from 'faker';
import { EntityManager } from 'typeorm';
import { Country } from '../../src/app/data/entities/external/location/country.entity';

export const createCountry = async ({ entityManager }: { entityManager: EntityManager }) => {
    const entity = new Country();
    entity.id = randomUUID();
    entity.name = faker.address.country();
    entity.code = faker.address.countryCode();
    return entityManager.save(entity);
};
