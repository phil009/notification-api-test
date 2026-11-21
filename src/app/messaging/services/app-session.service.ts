import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { AppSession } from '../../data/entities/app-session.entity';
import { APPLICATION_ID, APPLICATION_VERSION, FIREBASE_TOKEN } from '../listeners/user/user-session.listener';
import { PortalUserSessionDto } from '../messages/portal-user-session.dto';

@Injectable()
export class AppSessionService {
    constructor(private entityManager: EntityManager) {}

    @Transactional()
    async create(dto: PortalUserSessionDto, data: Record<string, string>): Promise<AppSession> {
        const entity = new AppSession();
        entity.id = dto.sessionId;
        return this.update(entity, dto, data);
    }

    @Transactional()
    async update(entity: AppSession, dto: PortalUserSessionDto, data: Record<string, string>): Promise<AppSession> {
        entity.userId = dto.userId;
        entity.authenticationType = dto.authenticationType;
        entity.identifier = dto.identifier;
        entity.startedAt = dto.startedAt;
        entity.endedAt = dto.deactivatedAt;

        entity.lastSeenAt = dto.lastSeenAt;
        entity.expiresAt = dto.expiresAt;

        if (data) {
            entity.applicationId = data[APPLICATION_ID];
            entity.applicationVersion = data[APPLICATION_VERSION];
            entity.firebaseToken = data[FIREBASE_TOKEN];
        }

        return this.entityManager.save(entity);
    }
}
