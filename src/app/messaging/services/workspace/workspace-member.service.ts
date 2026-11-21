import { Inject, Injectable, InjectionToken, LazyDIContainer } from '@matchmakerjs/di';
import { RequestMetadata } from '@matchmakerjs/matchmaker-security';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager, In } from 'typeorm';
import { RbacRoleApiResponse, RbacWorkspaceMemberApiResponse } from '../../../../sdk/rbac-api-sdk';
import { TemplateEngine } from '../../../../utils/template-engine';
import { PLATFORM_ADMIN } from '../../../constants/app.constant';
import { PortalUser } from '../../../data/entities/external/portal-user.entity';
import { Role } from '../../../data/entities/external/workspace/role.entity';
import { WorkspaceMemberRole } from '../../../data/entities/external/workspace/workspace-member-role.entity';
import { WorkspaceMember } from '../../../data/entities/external/workspace/workspace-member.entity';
import { UserInvitation } from '../../../data/entities/user-invitation.entity';
import { MailSender } from '../../../integrations/email/mail-sender';

@Injectable()
export class WorkspaceMemberService {
    constructor(
        @Inject(InjectionToken.container) private container: LazyDIContainer,
        private mailSender: MailSender,
        private templateEngine: TemplateEngine,
        private entityManager: EntityManager,
    ) {}

    @Transactional()
    async createWorkspaceMember(data: RbacWorkspaceMemberApiResponse): Promise<WorkspaceMember> {
        const entity = new WorkspaceMember();
        entity.id = data.id.toString();
        await this.updateWorkspaceMember(entity, data);
        return entity;
    }

    @Transactional()
    async markAsDeleted(entity: WorkspaceMember): Promise<WorkspaceMember> {
        const requestMetadata: RequestMetadata = this.container.get(RequestMetadata);
        entity.audit.deactivatedAt = new Date();
        entity.audit.deactivatedBy = requestMetadata.userId;
        await this.entityManager.save(entity);
        return entity;
    }

    @Transactional()
    async updateWorkspaceMember(entity: WorkspaceMember, data: RbacWorkspaceMemberApiResponse): Promise<void> {
        entity.workspaceId = data.workspace.code;

        if (data.userId) {
            const user = new PortalUser();
            user.userId = data.userId;
            entity.user = user;
        }
        entity.isInvitation = data.isInvitation;
        if (data.isInvitation) {
            entity.invitationAccepted = data.invitation.accepted;
            entity.invitationReviewedAt = data.invitation.reviewedAt && new Date(data.invitation.reviewedAt);
            entity.invitedUserIdentifier = data.invitation.userIdentifier;
            entity.invitedUserIdentifierType = data.invitation.userIdentifierType;
        }
        entity.audit.version = data.version;

        entity.audit.receivedAt = new Date();
        entity.audit.createdAt = data.audit.createdAt && new Date(data.audit.createdAt);
        entity.audit.createdBy = data.audit.createdBy;
        entity.audit.lastUpdatedAt = data.audit.lastUpdatedAt && new Date(data.audit.lastUpdatedAt);
        entity.audit.lastUpdatedBy = data.audit.lastUpdatedBy;
        entity.audit.deactivatedAt = data.audit.deactivatedAt && new Date(data.audit.deactivatedAt);
        entity.audit.deactivatedBy = data.audit.deactivatedBy;

        await this.entityManager.save(entity);
        await this.setRoles(entity, data.roles);
    }

    private async setRoles(entity: WorkspaceMember, roleList: RbacRoleApiResponse[]) {
        await this.entityManager
            .createQueryBuilder()
            .delete()
            .from(WorkspaceMemberRole)
            .where('member=:membershipId', { membershipId: entity.id })
            .callListeners(false)
            .execute();

        for (const roleData of roleList) {
            const role = new Role();
            role.id = roleData.id.toString();

            const memberRole = new WorkspaceMemberRole();
            memberRole.member = entity;
            memberRole.role = role;
            entity.audit.receivedAt = new Date();
            await this.entityManager.save(memberRole);
        }
    }

    async loadRoles(members: WorkspaceMember[]) {
        if (!members?.length) {
            return;
        }
        const roles = await this.entityManager.find(WorkspaceMemberRole, {
            where: {
                member: {
                    id: In(members.map((it) => it.id)),
                },
            },
            relations: ['role', 'member'],
        });
        members.forEach((member) => (member.roles = roles.filter((role) => role.member.id === member.id)));
    }

    async sendMailWithVerificationCode(invitation: UserInvitation, verificationCode: string) {
        const user = await this.entityManager.getRepository(PortalUser).findOne({
            emailAddress: invitation?.identifier,
        });
        const workspaceName = 'Telah Admin';
        if (invitation.workspaceId !== PLATFORM_ADMIN) {
            // const organisation = await this.entityManager.findOne(Organisation, invitation.workspaceId);
            // if (!organisation) return;
            // workspaceName = organisation.name;
        }

        const params = {
            new: true,
            invitationId: invitation.member.id,
            emailAddress: invitation.identifier,
            requestId: invitation.id,
            verificationCode,
        };
        if (user) {
            delete params.new;
        }
        return this.sendMail(invitation.identifier, workspaceName, params);
    }

    async sendMailForExistingUser(dto: RbacWorkspaceMemberApiResponse) {
        return this.sendMail(
            dto.invitation.userIdentifier,
            dto.workspace.code === PLATFORM_ADMIN ? 'Telah Admin' : dto.workspace.name,
            {
                invitationId: dto.id,
                emailAddress: dto.invitation.userIdentifier,
            },
        );
    }

    private async sendMail(identifier: string, workspaceName: string, query: unknown) {
        const queryString = Object.entries(query)
            .filter((entry) => entry.length == 2 && entry[1])
            .map((entry) => `${entry[0]}=${encodeURIComponent(entry[1])}`)
            .join('&');
        console.log(`${process.env.APP_URL}/accept-invitation?${queryString}`);
        return this.mailSender.sendMail({
            to: identifier,
            subject: `Invitation to join ${workspaceName}`,
            html: await this.templateEngine.compile('workspace-member-invitation.html', {
                workspaceName,
                emailAddress: identifier,
                url: `${process.env.APP_URL}/accept-invitation?${queryString}`,
            }),
        });
    }
}
