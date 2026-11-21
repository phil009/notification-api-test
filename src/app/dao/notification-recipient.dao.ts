import { Injectable } from '@matchmakerjs/di';
import { EntityManager } from 'typeorm';
import { NotificationRecipient } from '../data/entities/notification-recipient.entity';

@Injectable()
export class NotificationRecipientDao {
    constructor(private entityManager: EntityManager) {}

    async getById(id: number): Promise<NotificationRecipient> {
        return this.entityManager.findOne(NotificationRecipient, id);
    }
}
