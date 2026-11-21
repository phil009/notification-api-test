export abstract class SmsSender {
    abstract sendSms(sms: { from?: string; to: string; message: string }): Promise<unknown>;
}
