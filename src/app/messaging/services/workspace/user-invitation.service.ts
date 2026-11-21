import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { RbacWorkspaceMemberApiResponse } from '../../../../sdk/rbac-api-sdk';
import { WorkspaceMember } from '../../../data/entities/external/workspace/workspace-member.entity';
import { UserInvitation } from '../../../data/entities/user-invitation.entity';

@Injectable()
export class UserInvitationService {
    constructor(private entityManager: EntityManager) {}

    @Transactional()
    async createUserInvitation(data: RbacWorkspaceMemberApiResponse): Promise<UserInvitation> {
        const entity = new UserInvitation();
        entity.identifierType = data.invitation.userIdentifierType;
        entity.identifier = data.invitation.userIdentifier;
        entity.member = new WorkspaceMember();
        entity.member.id = data.id.toString();
        entity.workspaceId = data.workspace.code;
        await this.entityManager.save(entity);
        return entity;
    }
}
