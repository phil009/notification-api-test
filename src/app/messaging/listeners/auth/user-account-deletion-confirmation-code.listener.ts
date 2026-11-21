import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity } from '@matchmakerjs/typeorm-audit';
import { TemplateEngine } from '../../../../utils/template-engine';
import { USER_ACCOUNT_DELETION_REQUEST_TOPIC } from '../../../constants/topics.constant';
import { MailSender } from '../../../integrations/email/mail-sender';
import { UserAccountDeletionRequestMessage } from '../../messages/user-account-deletion-request.message';

@Injectable()
export class UserAccountDeletionRequestMessageListener implements MessageListener {
    constructor(private templateEngine: TemplateEngine, private mailSender: MailSender) {}

    @Activity('USER ACCOUNT DELETION REQUEST NOTIFICATION')
    async processMessage(message: Buffer): Promise<void> {
        const dto: UserAccountDeletionRequestMessage = JSON.parse(message.toString());

        try {
            // let host = dto.requestHost;
            // if (!host.startsWith('http')) {
            //     host = `http://${host}`;
            // }
            const response = await this.mailSender.sendMail({
                to: dto.emailAddress,
                subject: 'Confirm Account Deletion Request',
                html: await this.templateEngine.compile('confirm-account-deletion.html', {
                    // emailAddress: dto.identifier,
                    // // eslint-disable-next-line
                    // expiresIn: (dayjs(dto.expiresAt) as any).fromNow(true),
                    // url: `${host}/reset-password?identifier=${encodeURIComponent(dto.identifier)}&resetCode=${
                    //     dto.resetCode
                    // }`,
                    displayName: dto.displayName,
                    confirmationCode: dto.code,
                }),
            });
            console.log(this.getTopic(), dto.emailAddress, response);
        } catch (e) {
            console.error(e);
        }
    }

    getTopic(): string {
        return USER_ACCOUNT_DELETION_REQUEST_TOPIC;
    }
}
