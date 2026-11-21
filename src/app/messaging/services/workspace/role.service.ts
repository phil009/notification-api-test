import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { RbacRoleApiResponse } from '../../../../sdk/rbac-api-sdk';
import { Role } from '../../../data/entities/external/workspace/role.entity';

@Injectable()
export class RoleService {
    constructor(private entityManager: EntityManager) {}

    @Transactional()
    async createRole(data: RbacRoleApiResponse): Promise<Role> {
        const entity = new Role();
        entity.id = data.id.toString();
        await this.updateRole(entity, data);
        return entity;
    }

    @Transactional()
    async updateRole(entity: Role, data: RbacRoleApiResponse): Promise<void> {
        entity.workspaceId = data.workspace?.code;

        entity.name = data.name;
        entity.code = data.code;

        entity.audit.version = data.version;

        entity.audit.createdAt = data.audit.createdAt && new Date(data.audit.createdAt);
        entity.audit.createdBy = data.audit.createdBy;
        entity.audit.lastUpdatedAt = data.audit.lastUpdatedAt && new Date(data.audit.lastUpdatedAt);
        entity.audit.lastUpdatedBy = data.audit.lastUpdatedBy;
        entity.audit.deactivatedAt = data.audit.deactivatedAt && new Date(data.audit.deactivatedAt);
        entity.audit.deactivatedBy = data.audit.deactivatedBy;

        await this.entityManager.save(entity);
    }
}
