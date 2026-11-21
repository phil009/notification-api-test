export type MailAttachment = {
    filename: string;
    content: Buffer;
    contentType?: string;
};

export abstract class MailSender {
    abstract sendMail(mail: {
        from?: string;
        to: string | string[];
        cc?: string[];
        subject: string;
        html: string;
        attachments?: MailAttachment[];
    }): Promise<unknown>;
}
