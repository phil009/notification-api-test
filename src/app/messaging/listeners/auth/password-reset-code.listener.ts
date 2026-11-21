import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity } from '@matchmakerjs/typeorm-audit';
import { TemplateEngine } from '../../../../utils/template-engine';
import { PASSWORD_RESET_CODE_TOPIC } from '../../../constants/topics.constant';
import { MailSender } from '../../../integrations/email/mail-sender';
import { PasswordResetCodeDto } from '../../messages/password-reset-code.dto';

@Injectable()
export class PasswordResetCodeMessageListener implements MessageListener {
    constructor(private templateEngine: TemplateEngine, private mailSender: MailSender) {}

    @Activity('PORTAL USER IDENTIFIER VERIFICATION REQUEST NOTIFICATION')
    async processMessage(message: Buffer): Promise<void> {
        const dto: PasswordResetCodeDto = JSON.parse(message.toString());

        if (dto.expiresAt && new Date(dto.expiresAt).getTime() < new Date().getTime()) {
            return;
        }

        if (dto.identifierType !== 'EMAIL_ADDRESS') {
            console.log('Not EMAIL_ADDRESS:', dto.identifierType);
            return;
        }

        try {
            // let host = dto.requestHost;
            // if (!host.startsWith('http')) {
            //     host = `http://${host}`;
            // }
            const response = await this.mailSender.sendMail({
                to: dto.identifier,
                subject: 'Password Reset',
                html: await this.templateEngine.compile('forgot-password.html', {
                    // emailAddress: dto.identifier,
                    // // eslint-disable-next-line
                    // expiresIn: (dayjs(dto.expiresAt) as any).fromNow(true),
                    // url: `${host}/reset-password?identifier=${encodeURIComponent(dto.identifier)}&resetCode=${
                    //     dto.resetCode
                    // }`,
                    resetCode: dto.resetCode,
                }),
            });
            console.log(this.getTopic(), dto.identifier, response);
        } catch (e) {
            console.error(e);
        }
    }

    getTopic(): string {
        return PASSWORD_RESET_CODE_TOPIC;
    }
}
