import twilio from 'twilio';
import { SmsSender } from './sms-sender';

export class TwilioClient implements SmsSender {
    private client: twilio.Twilio;

    constructor(options: { accountSid: string; authToken: string }) {
        this.client = twilio(options.accountSid, options.authToken);
    }

    async sendSms(sms: { from?: string; to: string; message: string }): Promise<void> {
        return this.client.messages
            .create({
                body: sms.message,
                from: sms.from || process.env.SMS_SENDER_NAME || 'TELAH',
                to: sms.to,
            })
            .then((message) => console.log(message));
    }

    async makeCall(sms: { from?: string; to: string; message: string }): Promise<void> {
        await this.client.calls
            .create({
                twiml: `<Response><Say>${sms.message}</Say></Response>`,
                to: sms.to,
                from: sms.from || process.env.SMS_SENDER_NAME || 'TELAH',
            })
            .then((call) => console.log('sid:', call.sid));
    }
}
