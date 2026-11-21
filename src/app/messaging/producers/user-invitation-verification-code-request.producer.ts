import { Inject, Injectable } from '@matchmakerjs/di';
import { KAFKA_PRODUCER } from '@matchmakerjs/matchmaker-kafkajs';
import { Producer } from 'kafkajs';
import { EntityManager } from 'typeorm';
import { UserInvitation } from '../../data/entities/user-invitation.entity';
import { ExternalPortalUserIdentifierVerificationCodeMessage } from '../messages/external-portal-user-identifier-verification-code-request.message';

@Injectable()
export class UserInvitationVerificationCodeRequestMessageProducer {
    constructor(@Inject(KAFKA_PRODUCER) private producer: Producer, private entityManager: EntityManager) {}

    // @Activity('REQUEST VERIFICATION CODE FOR INVITED USER')
    async publish(userInvitation: UserInvitation): Promise<void> {
        await this.producer.send({
            topic:
                process.env.EXTERNAL_USER_IDENTIFIER_VERIFICATION_REQUEST ||
                'external_user_identifier_verification_request',
            messages: [
                {
                    key: userInvitation.id,
                    value: JSON.stringify({
                        referenceId: userInvitation.id,
                        identifier: userInvitation.identifier,
                        identifierType: userInvitation.identifierType,
                    } as ExternalPortalUserIdentifierVerificationCodeMessage),
                },
            ],
        });
        console.log('requested verification code for', userInvitation.identifier);
    }
}
