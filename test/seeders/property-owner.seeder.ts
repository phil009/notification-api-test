import { randomUUID } from 'crypto';
import * as faker from 'faker';
import { EntityManager } from 'typeorm';
import { PropertyOwner } from '../../src/app/data/entities/external/property/property-owner.entity';
import { Workspace } from '../../src/app/data/entities/external/workspace/workspace.entity';
import { createWorkspace } from './workspace.seeder';

export const createPropertyOwner = async ({
    entityManager,
    workspace,
}: {
    entityManager: EntityManager;
    workspace?: Workspace;
}) => {
    const entity = new PropertyOwner();
    entity.id = randomUUID();
    entity.workspace = workspace || (await createWorkspace({ entityManager }));
    entity.firstName = faker.name.firstName();
    entity.lastName = faker.name.lastName();
    entity.displayName = `${entity.firstName} ${entity.lastName}`;
    return entityManager.save(entity);
};
