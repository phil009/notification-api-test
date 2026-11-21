import nodemailer from 'nodemailer';
import { MailSender } from '../../src/app/integrations/email/mail-sender';
import { MailAuth, MailConfig, MailMessageTemplate } from './types';

class EmailClient implements MailSender {
    private transporter: nodemailer.Transporter;
    private auth: MailAuth = {
        host: 'sandbox.smtp.mailtrap.io',
        port: 2525,
        user: '0ac57a32567d3d',
        pass: 'caa3b1a5799f2e',
    };

    constructor(auth?: MailAuth, config: MailConfig = {}) {
        if (auth) {
            console.log('Authenticated');
            this.auth = auth;
        }
        if (this.auth.port == 465) config.secure = true;

        this.transporter = nodemailer.createTransport({
            host: this.auth.host,
            port: this.auth.port,
            secure: config.secure, // Use `true` for port 465, `false` for all other ports
            auth: {
                user: this.auth.user,
                pass: this.auth.pass,
            },
        });
    }

    async sendMail({
        subject,
        from,
        to,
        html,
    }: {
        from?: string;
        to: string | string[];
        cc?: string[];
        subject: string;
        html: string;
    }): Promise<unknown> {
        const response = await this.send({
            to: Array.isArray(to) ? to[0] : to,
            subject,
            from,
            html,
        });
        console.log('Nodemailer response:', response);
        return response;
    }

    async send(message: MailMessageTemplate): Promise<boolean> {
        if (!message.to) {
            return false;
        }
        const mailOptions = {
            from: message.from ?? '"Telah Notification" <no-reply@telah.ng>',
            to: message.to,
            subject: message.subject,
            text: message.text,
            html: message.html,
        };
        try {
            await this.transporter.sendMail(mailOptions);
            Promise.resolve(true);
        } catch (err) {
            return false;
        }
    }
}

export default EmailClient;
