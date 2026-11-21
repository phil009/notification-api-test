import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity } from '@matchmakerjs/typeorm-audit';
import { PHONE_NUMBER_OUTBOUND_MESSAGE_TOPIC } from '../../constants/topics.constant';
import { TwilioClient } from '../../integrations/twilio/twilio-client';
import {
    PhoneNumberContactMethod,
    PhoneNumberOutboundMessage,
} from '../messages/phone-number-outbound-message.message';

@Injectable()
export class PhoneNumberOutboundMessageListener implements MessageListener {
    constructor(private twilioClient: TwilioClient) {}

    @Activity('PROCESS PHONE NUMBER OUTBOUND MESSAGE')
    async processMessage(message: Buffer): Promise<void> {
        const dto: PhoneNumberOutboundMessage = JSON.parse(message.toString());

        try {
            if (dto.deliveryMethod === PhoneNumberContactMethod.VOICE_CALL) {
                await this.twilioClient.makeCall({
                    to: dto.phoneNumber,
                    message: dto.message,
                });
            } else if (dto.deliveryMethod === PhoneNumberContactMethod.SMS) {
                await this.twilioClient.sendSms({
                    to: dto.phoneNumber,
                    message: dto.message,
                });
            }
        } catch (e) {
            console.error(e);
        }
    }

    getTopic(): string {
        return PHONE_NUMBER_OUTBOUND_MESSAGE_TOPIC;
    }
}
