import { randomUUID } from 'crypto';
import * as faker from 'faker';
import { EntityManager } from 'typeorm';
import { Notification } from '../../src/app/data/entities/notification.entity';
import { NotificationType } from '../../src/app/data/enums/notification-type.enum';

export const createNotification = async ({
    entityManager,
    type,
    title,
    message,
}: {
    entityManager: EntityManager;
    type: NotificationType;
    title?: string;
    message?: string;
}) => {
    const entity = new Notification();
    entity.id = randomUUID();
    entity.type = type;
    entity.title = title || faker.lorem.sentence();
    entity.message = message;
    return entityManager.save(entity);
};
