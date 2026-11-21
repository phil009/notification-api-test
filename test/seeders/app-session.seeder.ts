import { randomUUID } from 'crypto';
import { EntityManager } from 'typeorm';
import { AppSession } from '../../src/app/data/entities/app-session.entity';

export const createAppSession = async ({
    entityManager,
    userId,
    applicationId,
    startedAt,
    endedAt,
    expiresAt,
}: {
    entityManager: EntityManager;
    userId: string;
    applicationId: string;
    startedAt: Date;
    endedAt?: Date;
    expiresAt: Date;
}) => {
    const entity = new AppSession();
    entity.id = randomUUID();
    entity.userId = userId;
    entity.authenticationType = 'LOGIN';

    entity.startedAt = startedAt;
    entity.endedAt = endedAt;
    entity.expiresAt = expiresAt;

    entity.applicationId = applicationId;
    entity.applicationVersion = randomUUID();
    entity.firebaseToken = randomUUID();
    return entityManager.save(entity);
};
