import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { Workspace } from '../../../data/entities/external/workspace/workspace.entity';
import { WorkspaceMessage } from '../../messages/workspace.message';

@Injectable()
export class WorkspaceService {
    constructor(private entityManager: EntityManager) {}

    @Transactional()
    async create(data: WorkspaceMessage): Promise<Workspace> {
        const entity = new Workspace();
        entity.id = data.code;
        await this.update(entity, data);
        return entity;
    }

    @Transactional()
    async update(entity: Workspace, data: WorkspaceMessage): Promise<void> {
        entity.name = data.name;
        entity.type = data.type?.code;
        entity.hasLogo = !!data.displayPictureUrl;
        entity.audit.createdBy = data.audit?.createdBy;
        entity.audit.createdAt = data.audit?.createdAt && new Date(data.audit.createdAt);
        entity.audit.version = data.version;
        await this.entityManager.save(entity);
    }
}
