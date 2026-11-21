import * as faker from 'faker';
import { EntityManager } from 'typeorm';
import { Address } from '../../src/app/data/entities/address.entity';
import { Lga } from '../../src/app/data/entities/external/location/lga.entity';
import { createLga } from './lga.seeder';

export const createAddress = async ({
    entityManager,
    lga,
    city,
    streetAddress,
}: {
    entityManager: EntityManager;
    lga?: Lga;
    city?: string;
    streetAddress?: string;
}) => {
    const entity = new Address();
    entity.lga = lga || (await createLga({ entityManager }));
    entity.city = city || faker.address.city();
    entity.streetAddress = streetAddress || faker.address.streetAddress();
    return entityManager.save(entity);
};
