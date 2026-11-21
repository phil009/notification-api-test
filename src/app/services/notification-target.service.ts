import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { LedgerApiOccupantApiResponseTypeEnum } from '../../sdk/ledger-api-sdk';
import { NotificationTarget } from '../data/entities/notification-target.entity';
import { Notification } from '../data/entities/notification.entity';
import { NotificationRecipientType } from '../data/enums/notification-recipient-type.enum';

@Injectable()
export class NotificationTargetService {
    constructor(private entityManager: EntityManager) {}

    @Transactional()
    createForUser(notification: Notification, userId: string): Promise<NotificationTarget> {
        const entity = new NotificationTarget();
        entity.notification = notification;
        entity.type = NotificationRecipientType.USER;
        entity.userId = userId;
        return this.entityManager.save(entity);
    }

    @Transactional()
    createForOccupant(
        notification: Notification,
        tenureId: string,
        type: LedgerApiOccupantApiResponseTypeEnum,
    ): Promise<NotificationTarget> {
        const entity = new NotificationTarget();
        entity.notification = notification;
        entity.type = NotificationRecipientType.TENURE;
        entity.tenureId = tenureId;
        entity.occupantType = type;
        return this.entityManager.save(entity);
    }

    @Transactional()
    createForWorkspace(notification: Notification, workspaceId: string): Promise<NotificationTarget> {
        const entity = new NotificationTarget();
        entity.notification = notification;
        entity.type = NotificationRecipientType.WORKSPACE;
        entity.workspaceId = workspaceId;
        return this.entityManager.save(entity);
    }
}
