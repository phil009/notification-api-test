import { randomUUID } from 'crypto';
import * as faker from 'faker';
import { EntityManager } from 'typeorm';
import { Lga } from '../../src/app/data/entities/external/location/lga.entity';
import { State } from '../../src/app/data/entities/external/location/state.entity';
import { createState } from './state.seeder';

export const createLga = async ({ entityManager, state }: { entityManager: EntityManager; state?: State }) => {
    const entity = new Lga();
    entity.state = state || (await createState({ entityManager }));
    entity.id = randomUUID();
    entity.name = faker.address.county();
    entity.code = faker.address.county();
    return entityManager.save(entity);
};
