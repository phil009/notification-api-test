import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { MailSender } from '../../../integrations/email/mail-sender';
import { RBAC_WORKSPACE_TOPIC } from '../../../constants/topics.constant';
import { PortalUser } from '../../../data/entities/external/portal-user.entity';
import { Workspace } from '../../../data/entities/external/workspace/workspace.entity';
import { WorkspaceMessage } from '../../messages/workspace.message';
import { WorkspaceService } from '../../services/workspace/workspace.service';
import { TemplateEngine } from '../../../../utils/template-engine';

@Injectable()
export class WorkspaceMessageListener implements MessageListener {
    constructor(
        private entityManager: EntityManager,
        private workspaceService: WorkspaceService,
        private mailSender: MailSender,
        private templateEngine: TemplateEngine,
    ) {}

    @Activity('WORKSPACE NOTIFICATION')
    async processMessage(message: Buffer): Promise<void> {
        const dto: WorkspaceMessage = JSON.parse(message.toString());

        if (!['REALTOR', 'LANDLORD'].includes(dto.type?.code)) {
            return;
        }

        const entity = await this.entityManager.getRepository(Workspace).findOne({ id: dto.code });
        if (!entity) {
            await this.workspaceService.create(dto);
            await this.sendWelcomeEmail(dto);
        } else if (entity.audit.version <= dto.version) {
            await this.workspaceService.update(entity, dto);
        }
    }

    private async sendWelcomeEmail(dto: WorkspaceMessage): Promise<void> {
        try {
            const user = await this.entityManager
                .getRepository(PortalUser)
                .findOne({ userId: dto.audit?.createdBy });

            if (!user?.emailAddress || !user?.displayName) {
                console.log(this.getTopic(), `Skipping workspace welcome email: missing user data for ${dto.audit?.createdBy}`);
                return;
            }

            const template =
                dto.type.code === 'LANDLORD'
                    ? 'welcome-landlord-workspace.html'
                    : 'welcome-agency-workspace.html';

            const html = await this.templateEngine.compile(template, {
                displayName: user.displayName,
                workspaceName: dto.name,
            });

            const subject =
                dto.type.code === 'LANDLORD'
                    ? 'Welcome to TELAH – Your Landlord Workspace is Ready'
                    : 'Welcome to TELAH – Your Agency Workspace is Ready';

            await this.mailSender.sendMail({ to: user.emailAddress, subject, html });
            console.log(this.getTopic(), `Workspace welcome email sent to ${user.emailAddress}`);
        } catch (e) {
            console.error(this.getTopic(), `Failed to send workspace welcome email for workspace ${dto.code}:`, e);
        }
    }

    getTopic(): string {
        return RBAC_WORKSPACE_TOPIC;
    }
}
