import { randomUUID } from 'crypto';
import * as faker from 'faker';
import { EntityManager } from 'typeorm';
import { Address } from '../../src/app/data/entities/address.entity';
import { PropertyOwner } from '../../src/app/data/entities/external/property/property-owner.entity';
import { Property } from '../../src/app/data/entities/external/property/property.entity';

export const createProperty = async ({
    entityManager,
    owner,
    name,
    address,
}: // parent,
{
    entityManager: EntityManager;
    workspaceId?: string;
    owner?: PropertyOwner;
    name?: string;
    address?: Address;
    // parent?: Place;
}) => {
    const entity = new Property();
    entity.id = randomUUID();
    entity.name = faker.random.word();
    entity.owner = owner;
    entity.name = name;
    entity.address = address;
    // entity.parent = parent;
    return entityManager.save(entity);
};
