import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity } from '@matchmakerjs/typeorm-audit';
import { PHONE_CALL_TOPIC } from '../../constants/topics.constant';
import { TwilioClient } from '../../integrations/twilio/twilio-client';
import { PhoneCallRequestMessage } from '../messages/phone-call.message';

@Injectable()
export class PhoneCallRequestMessageListener implements MessageListener {
    constructor(private twilioClient: TwilioClient) {}

    @Activity('PROCESS PHONE CALL REQUESTS')
    async processMessage(message: Buffer): Promise<void> {
        const dto: PhoneCallRequestMessage = JSON.parse(message.toString());

        try {
            await this.twilioClient.makeCall({
                to: dto.phoneNumber,
                message: dto.message,
            });
        } catch (e) {
            console.error(e);
        }
    }

    getTopic(): string {
        return PHONE_CALL_TOPIC;
    }
}
