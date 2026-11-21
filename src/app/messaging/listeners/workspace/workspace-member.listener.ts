import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { RbacWorkspaceMemberApiResponse } from '../../../../sdk/account-api-sdk';
import { WORKSPACE_MEMBER_TOPIC } from '../../../constants/topics.constant';
import { PortalUser } from '../../../data/entities/external/portal-user.entity';
import { WorkspaceMember } from '../../../data/entities/external/workspace/workspace-member.entity';
import { UserInvitationVerificationCodeRequestMessageProducer } from '../../producers/user-invitation-verification-code-request.producer';
import { UserInvitationService } from '../../services/workspace/user-invitation.service';
import { WorkspaceMemberService } from '../../services/workspace/workspace-member.service';

@Injectable()
export class WorkspaceMemberMessageListener implements MessageListener {
    constructor(
        private entityManager: EntityManager,
        private workspaceMemberService: WorkspaceMemberService,
        private userInvitationService: UserInvitationService,
        private userInvitationVerificationCodeRequestMessageProducer: UserInvitationVerificationCodeRequestMessageProducer,
    ) {}

    @Activity('WORKSPACE MEMBER NOTIFICATION')
    async processMessage(message: Buffer): Promise<void> {
        const dto: RbacWorkspaceMemberApiResponse = JSON.parse(message.toString());
        // console.log(message.toString());

        const entity = await this.entityManager.getRepository(WorkspaceMember).findOne({
            where: {
                id: dto.id.toString(),
            },
            withDeleted: true,
            relations: ['user'],
        });

        if (entity) {
            if (!entity.user && dto.userId) {
                console.log(`Invitation ${dto.id} accepted by ${dto.invitation.userIdentifier}`);
            }
            if (entity.audit.version <= dto.version) {
                await this.workspaceMemberService.updateWorkspaceMember(entity, dto);
            }
            return;
        }

        await this.workspaceMemberService.createWorkspaceMember(dto);
        if (dto.userId || dto.audit.deactivatedAt || dto.invitation?.userIdentifierType !== 'EMAIL_ADDRESS') {
            return;
        }

        const user = await this.entityManager
            .createQueryBuilder(PortalUser, 'e')
            .where('lower(e.emailAddress)=lower(:emailAddress)', {
                emailAddress: dto.invitation.userIdentifier,
            })
            .getOne();

        if (!user || !user.emailAddressVerified) {
            const userInvitation = await this.userInvitationService.createUserInvitation(dto);
            userInvitation.verificationCodeRequestedAt = new Date();
            await this.entityManager.save(userInvitation, {
                listeners: false,
            });
            await this.userInvitationVerificationCodeRequestMessageProducer.publish(userInvitation);
        } else {
            const response = await this.workspaceMemberService.sendMailForExistingUser(dto);
            console.log(this.getTopic(), dto.invitation.userIdentifier, response);
        }
    }

    getTopic(): string {
        return WORKSPACE_MEMBER_TOPIC;
    }
}
