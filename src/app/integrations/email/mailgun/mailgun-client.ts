import axios, { AxiosRequestHeaders } from 'axios';
import FormData from 'form-data';
import { IncomingHttpHeaders } from 'http';
import { MailAttachment, MailSender } from '../mail-sender';

export class MailgunClient implements MailSender {
    readonly bearerToken: string;

    constructor() {
        this.bearerToken = Buffer.from(`api:${process.env.MAILGUN_MESSAGES_API_KEY}`).toString('base64');
    }

    async sendMail(mail: {
        from?: string;
        to: string | string[];
        cc?: string[];
        subject: string;
        html: string;
        attachments?: MailAttachment[];
    }): Promise<unknown> {
        const formData = new FormData();
        formData.append('from', mail.from || `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`);
        if (Array.isArray(mail.to)) {
            mail.to.forEach((to) => formData.append('to', to));
        } else {
            formData.append('to', mail.to);
        }
        mail.cc?.forEach((cc) => formData.append('cc', cc));
        formData.append('subject', mail.subject);
        formData.append('html', mail.html);
        mail.attachments?.forEach((it) => formData.append('attachment', it.content, it.filename));
        return axios
            .post(process.env.MAILGUN_MESSAGES_URL + 'messages', formData, {
                headers: {
                    ...formData.getHeaders(),
                    authorization: `Bearer ${this.bearerToken}`,
                } as IncomingHttpHeaders & AxiosRequestHeaders,
            })
            .then((axiosRes) => axiosRes.data);
    }
}
