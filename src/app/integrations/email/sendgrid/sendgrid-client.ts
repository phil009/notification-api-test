import axios, { AxiosRequestHeaders } from 'axios';
import { IncomingHttpHeaders } from 'http';
import { MailAttachment, MailSender } from '../mail-sender';

export class SendgridClient implements MailSender {
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
            from: {
                email: mail.from || process.env.EMAIL_SENDER_ADDRESS,
                name: !mail.from && process.env.EMAIL_SENDER_NAME,
            },
            personalizations: [
                {
                    to: [{ email: mail.to }],
                    // dynamic_template_data: substitutions,
                },
            ],
            subject: mail.subject,
            content: [
                {
                    type: 'text/html',
                    value: mail.html,
                },
            ],
            attachments: mail.attachments?.map((it) => ({
                content: it.content.toString('base64'),
                filename: it.filename,
                type: it.contentType || 'application/octet-stream',
                disposition: 'attachment',
            })),
        };

        return axios
            .post(process.env.SENDGRID_MAIL_URL, message, {
                headers: {
                    Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
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
