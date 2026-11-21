import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity } from '@matchmakerjs/typeorm-audit';
import { plainToInstance } from 'class-transformer';
import { EntityManager } from 'typeorm';
import { NameValuePair } from '../../../../sdk/account-api-sdk';
import { USER_SESSION_TOPIC } from '../../../constants/topics.constant';
import { AppSession } from '../../../data/entities/app-session.entity';
import { PortalUserSessionDto } from '../../messages/portal-user-session.dto';
import { AppSessionService } from '../../services/app-session.service';

export const APPLICATION_ID = 'APPLICATION_ID';
export const APPLICATION_VERSION = 'APPLICATION_VERSION';
export const FIREBASE_TOKEN = 'FIREBASE_TOKEN';

@Injectable()
export class UserSessionMessageListener implements MessageListener {
    constructor(private entityManager: EntityManager, private portalUserService: AppSessionService) {}

    @Activity('PORTAL USER SESSION NOTIFICATION')
    async processMessage(message: Buffer): Promise<void> {
        // console.log(`Received user session ${message.toString()}`);
        const dto = plainToInstance(PortalUserSessionDto, JSON.parse(message.toString()));
        // const data: Record<string, string> = {};
        // dto.data?.forEach((entry) => (data[entry.name] = entry.value));
        // if (!data[APPLICATION_ID] || !data[APPLICATION_VERSION] || !data[FIREBASE_TOKEN]) {
        //     return;
        // }

        const data = this.collectData(dto.data);

        const entity = await this.entityManager.getRepository(AppSession).findOne({ id: dto.sessionId });
        if (!entity) {
            if (!data || !data[APPLICATION_ID] || !data[APPLICATION_VERSION] || !data[FIREBASE_TOKEN]) {
                console.log('Ignored user session notification:', dto);
                return;
            }
            await this.portalUserService.create(dto, data);
        } else {
            if (entity.lastSeenAt.getTime() > new Date(dto.lastSeenAt).getTime()) {
                console.log('Ignored user session notification:', dto, entity);
                return;
            }
            await this.portalUserService.update(entity, dto, data);
        }
    }

    private collectData(nameValuePairs: NameValuePair[]) {
        if (!nameValuePairs) {
            return;
        }
        const data: Record<string, string> = {};
        nameValuePairs.forEach((entry) => (data[entry.name] = entry.value));
        return data;
    }

    getTopic(): string {
        return USER_SESSION_TOPIC;
    }
}
