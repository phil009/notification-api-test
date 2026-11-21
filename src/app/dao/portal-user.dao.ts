import { Injectable } from '@matchmakerjs/di';
import { EntityManager } from 'typeorm';
import { PortalUser } from '../data/entities/external/portal-user.entity';

@Injectable()
export class PortalUserDao {
    constructor(private entityManager: EntityManager) {}

    async getPortalUser(userId: string): Promise<PortalUser> {
        return this.entityManager.findOne(PortalUser, {
            where: {
                userId,
            },
        });
    }
}
