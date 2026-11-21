import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { PropertyPortfolioApiResponse } from '../../../../sdk/property-api-sdk';
import { PropertyOwner } from '../../../data/entities/external/property/property-owner.entity';
import { Workspace } from '../../../data/entities/external/workspace/workspace.entity';

@Injectable()
export class PropertyOwnerService {
    constructor(private entityManager: EntityManager) {}

    @Transactional()
    async create(data: PropertyPortfolioApiResponse): Promise<PropertyOwner> {
        const entity = new PropertyOwner();
        entity.id = data.id;
        await this.update(entity, data);
        return entity;
    }

    @Transactional()
    async update(entity: PropertyOwner, data: PropertyPortfolioApiResponse): Promise<PropertyOwner> {
        entity.workspace = {
            id: data.workspaceId,
        } as Workspace;

        entity.displayName = data.displayName;

        entity.audit.version = data.version;
        entity.audit.createdAt = data.createdAt && new Date(data.createdAt);
        return this.entityManager.save(entity);
    }
}
