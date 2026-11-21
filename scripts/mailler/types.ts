export type MailAuth = {
    host: string;
    port: number;
    user: string;
    pass: string;
    method?: string;
    tls?: boolean;
};

export type MailConfig = {
    secure?: boolean;
};

export interface MailMessageTemplate {
    to: string;
    html?: string;
    subject: string;
    text?: string;
    from?: string;
    cc?: string[];
    bcc?: string[];
    attachments?: string[];
    replyTo?: string;
    headers?: { [key: string]: string };
    templateId?: string;
    templateData?: { [key: string]: string };
    dynamicTemplateData?: { [key: string]: string };
    batchId?: string;
    batchName?: string;
    batchDescription?: string;
    batchInlineImages?: string[];
    batchInlineCss?: string[];
    batchInlineJs?: string[];
    batchInlineFonts?: string[];
    batchInlineImagesData?: string[];
    batchInlineCssData?: string[];
    batchInlineJsData?: string[];
    batchInlineFontsData?: string[];
    batchInlineImagesUrl?: string[];
    batchInlineCssUrl?: string[];
    batchInlineJsUrl?: string[];
    batchInlineFontsUrl?: string[];
    batchInlineImagesUrlData?: string[];
    batchInlineCssUrlData?: string[];
    batchInlineJsUrlData?: string[];
    batchInlineFontsUrlData?: string[];
}
