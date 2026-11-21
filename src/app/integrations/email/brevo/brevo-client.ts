import axios, { AxiosRequestHeaders } from 'axios';
import { IncomingHttpHeaders } from 'http';
import { MailAttachment, MailSender } from '../mail-sender';

export class BrevoClient implements MailSender {
    async sendMail(mail: {
        from?: string;
        to: string | string[];
        cc?: string[];
        subject: string;
        html: string;
        attachments?: MailAttachment[];
    }): Promise<unknown> {
        const message = {
            // template_id: 'xx',
            sender: {
                email: mail.from || process.env.EMAIL_SENDER_ADDRESS,
                name: !mail.from && process.env.EMAIL_SENDER_NAME,
            },
            to: [{ email: mail.to }],
            subject: mail.subject,
            htmlContent: mail.html,
            attachment: mail.attachments?.map((it) => ({
                name: it.filename,
                content: it.content.toString('base64'),
            })),
        };

        return axios
            .post(process.env.BREVO_MAIL_URL, message, {
                headers: {
                    'api-key': process.env.BREVO_API_KEY,
                } as IncomingHttpHeaders & AxiosRequestHeaders,
            })
            .then((axiosRes) => axiosRes.statusText)
            .catch((e) => {
                if (!axios.isAxiosError(e)) throw e;
                console.error(e.message, e.response?.status, e.response?.statusText, e.response?.data);
                return e.message;
            });
    }
}
