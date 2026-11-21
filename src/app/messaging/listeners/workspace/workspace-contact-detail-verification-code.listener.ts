import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { TemplateEngine } from '../../../../utils/template-engine';
import { WORKSPACE_CONTACT_DETAIL_VERIFICATION_REQUEST_TOPIC } from '../../../constants/topics.constant';
import { MailSender } from '../../../integrations/email/mail-sender';

class WorkspaceContactDetailVerificationCodeMessage {
    contactType: string;
    contact: string;

    referenceId: string;

    verificationCode: string;
    createdAt: string;
    expiresAt: string;
    requestHost: string;
    requestQuery: string;
}

@Injectable()
export class WorkspaceContactDetailVerificationCodeMessageListener implements MessageListener {
    constructor(
        private entityManager: EntityManager,
        private templateEngine: TemplateEngine,
        private mailSender: MailSender,
    ) {}

    @Activity('WORKSPACE CONTACT DETAIL VERIFICATION REQUEST NOTIFICATION')
    async processMessage(message: Buffer): Promise<void> {
        // console.log("message:", message?.toString());
        const dto: WorkspaceContactDetailVerificationCodeMessage = JSON.parse(message.toString());

        console.log('received verification code for', dto.contact);

        if (dto.expiresAt && new Date(dto.expiresAt).getTime() <= Date.now()) {
            return;
        }

        if (dto.contactType !== 'EMAIL_ADDRESS') {
            console.log('Not EMAIL_ADDRESS:', dto.contactType);
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
            console.log(`Workspace display name is not available for ${dto.contact}`);
            return;
        }

        const response = await this.mailSender.sendMail({
            to: dto.contact,
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
        console.log(this.getTopic(), dto.contact, response);
    }

    getTopic(): string {
        return WORKSPACE_CONTACT_DETAIL_VERIFICATION_REQUEST_TOPIC;
    }
}
