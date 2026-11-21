import { Injectable } from '@matchmakerjs/di';
import { EntityManager } from 'typeorm';
import { Workspace } from '../data/entities/external/workspace/workspace.entity';

@Injectable()
export class WorkspaceDao {
    constructor(private entityManager: EntityManager) {}

    async getById(id: string): Promise<Workspace> {
        return this.entityManager.createQueryBuilder(Workspace, 'e').where('e.id=:id', { id }).getOne();
    }
}
