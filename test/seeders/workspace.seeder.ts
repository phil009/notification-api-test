import { randomUUID } from 'crypto';
import * as faker from 'faker';
import { EntityManager } from 'typeorm';
import { Workspace } from '../../src/app/data/entities/external/workspace/workspace.entity';

export const createWorkspace = async ({
    entityManager,
    workspaceId,
    name,
    type,
}: {
    entityManager: EntityManager;
    workspaceId?: string;
    name?: string;
    type?: string;
}) => {
    const entity = new Workspace();
    entity.id = workspaceId || randomUUID();
    entity.name = name || faker.company.companyName();
    entity.type = type || 'LANDLORD';
    return entityManager.save(entity);
};
