import { Injectable } from '@matchmakerjs/di';
import { EntityManager, SelectQueryBuilder } from 'typeorm';
import { WorkspaceMember } from '../data/entities/external/workspace/workspace-member.entity';
import { NotificationTarget } from '../data/entities/notification-target.entity';
import { UserNotification } from '../data/entities/notification.entity';
import { NotificationRecipientType } from '../data/enums/notification-recipient-type.enum';
import {
    applyRecipientFilters,
    BaseNotificationsQueryOptions,
    buildNotificationsBaseQuery,
    fetchNotificationResults,
    ViewStatus
} from './notification.dao';

type WorkspaceNotificationsQueryOptions = BaseNotificationsQueryOptions & {
    userId: string;
    workspaceId: string;
};

@Injectable()
export class WorkspaceNotificationDao {
    constructor(private entityManager: EntityManager) {}

    async countUnviewedNotifications(userId: string, workspaceId: string): Promise<number> {
        const qb = this.createQuery({ userId, workspaceId, viewStatus: ViewStatus.UNVIEWED, loadAddress: false });
        const { total } = await qb.clone().select('count(DISTINCT e.id)', 'total').getRawOne();
        return Number(total);
    }

    createQuery(options: WorkspaceNotificationsQueryOptions, alias = 'e'): SelectQueryBuilder<UserNotification> {
        const { userId, workspaceId, viewStatus } = options;
        const qb = buildNotificationsBaseQuery(this.entityManager, options, alias);

        qb.innerJoin(NotificationTarget, `${alias}_nt`, `${alias}_nt.notification=${alias}.id`);
        qb.innerJoin(
            WorkspaceMember,
            `${alias}_wm`,
            `${alias}_wm.workspaceId = :workspaceId
                AND ${alias}_wm.user = :userId
                AND ${alias}_wm.deactivatedAt IS NULL
                AND (${alias}_wm.isInvitation IS NOT TRUE OR ${alias}_wm.invitationAccepted IS TRUE)`,
            { workspaceId, userId },
        );
        qb.andWhere(`${alias}_nt.type = :workspaceRecipientType AND ${alias}_nt.workspaceId = :workspaceId`, {
            workspaceRecipientType: NotificationRecipientType.WORKSPACE,
            workspaceId,
        });

        return applyRecipientFilters(qb, { userId, viewStatus }, alias);
    }

    async fetchResults(qb: SelectQueryBuilder<UserNotification>, options: { limit: number; offset?: number }, alias = 'e') {
        return fetchNotificationResults(qb, options, alias);
    }
}
