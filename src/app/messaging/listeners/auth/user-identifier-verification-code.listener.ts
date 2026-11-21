import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { TemplateEngine } from '../../../../utils/template-engine';
import { USER_IDENTIFIER_VERIFICATION_CODE_REQUEST_TOPIC } from '../../../constants/topics.constant';
import { PortalUser } from '../../../data/entities/external/portal-user.entity';
import { UserInvitation } from '../../../data/entities/user-invitation.entity';
import { MailSender } from '../../../integrations/email/mail-sender';
import { WorkspaceMemberService } from '../../services/workspace/workspace-member.service';

class PortalUserIdentifierVerificationCodeMessage {
    userId: string;
    identifierType: string;
    identifier: string;

    referenceId: string;

    verificationCode: string;
    createdAt: string;
    expiresAt: string;
    requestHost: string;
    requestQuery: string;
}

@Injectable()
export class UserIdentifierVerificationCodeMessageListener implements MessageListener {
    constructor(
        private entityManager: EntityManager,
        private templateEngine: TemplateEngine,
        private mailSender: MailSender,
        private workspaceMemberService: WorkspaceMemberService,
    ) {}

    @Activity('PORTAL USER IDENTIFIER VERIFICATION REQUEST NOTIFICATION')
    async processMessage(message: Buffer): Promise<void> {
        // console.log("message:", message?.toString());
        const dto: PortalUserIdentifierVerificationCodeMessage = JSON.parse(message.toString());

        console.log('received verification code for', dto.identifier);

        if (dto.expiresAt && new Date(dto.expiresAt).getTime() <= Date.now()) {
            return;
        }

        if (dto.identifierType !== 'EMAIL_ADDRESS') {
            console.log('Not EMAIL_ADDRESS:', dto.identifierType);
            return;
        }

        if (dto.referenceId) {
            const userInvitation = await this.entityManager.findOne(UserInvitation, dto.referenceId, {
                relations: ['member'],
            });
            if (userInvitation && !userInvitation.notificationSentAt) {
                // await this.workspaceMemberService.sendMailWithVerificationCode(userInvitation, dto.verificationCode);
                // userInvitation.notificationSentAt = new Date();
                // await this.entityManager.save(userInvitation);
            }
            return;
        }

        const user = await this.entityManager
            .createQueryBuilder(PortalUser, 'u')
            .where('lower(u.emailAddress)=lower(:emailAddress)', {
                emailAddress: dto.identifier,
            })
            .getOne();

        if (user?.emailAddressVerified) {
            console.log(`User ${dto.userId}/${dto.identifier} already verified email`);
            return;
        }

        // let host = dto.requestHost;
        // if (!host.startsWith('http')) {
        //     host = `http://${host}`;
        // }
        // console.log(`${host}/verify-email?emailAddress=${encodeURIComponent(dto.identifier)}&verificationCode=${dto.verificationCode
        //     }`);

        const searchParams = dto.requestQuery && new URLSearchParams(dto.requestQuery);
        const displayName = searchParams?.get('displayName');
        if (!displayName) {
            console.log(`User display name is not available for ${dto.identifier}`);
            return;
        }

        const response = await this.mailSender.sendMail({
            to: dto.identifier,
            subject: 'Email Verification',
            html: await this.templateEngine.compile('verify-email.html', {
                // emailAddress: dto.identifier,
                // // eslint-disable-next-line
                // expiresIn: (dayjs(dto.expiresAt) as any).fromNow(true),
                // url: `${host}/verify-email?emailAddress=${encodeURIComponent(dto.identifier)}&verificationCode=${dto.verificationCode
                //     }`,
                displayName,
                verificationCode: dto.verificationCode,
            }),
        });
        console.log(this.getTopic(), dto.identifier, response);
    }

    getTopic(): string {
        return USER_IDENTIFIER_VERIFICATION_CODE_REQUEST_TOPIC;
    }
}
