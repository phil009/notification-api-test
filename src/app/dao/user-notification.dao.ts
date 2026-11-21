import { Injectable } from '@matchmakerjs/di';
import { Brackets, EntityManager, SelectQueryBuilder } from 'typeorm';
import { PropertyUnitOccupant } from '../data/entities/external/tenure/property-unit-occupant.entity';
import { NotificationTarget } from '../data/entities/notification-target.entity';
import { UserNotification } from '../data/entities/notification.entity';
import { NotificationRecipientType } from '../data/enums/notification-recipient-type.enum';
import {
    applyRecipientFilters,
    BaseNotificationsQueryOptions,
    buildNotificationsBaseQuery,
    fetchNotificationResults,
    ViewStatus,
} from './notification.dao';

type UserNotificationsQueryOptions = BaseNotificationsQueryOptions & {
    userId: string;
};

@Injectable()
export class UserNotificationDao {
    constructor(private entityManager: EntityManager) {}

    async countUnviewedNotifications(userId: string): Promise<number> {
        const qb = this.createQuery({ userId, viewStatus: ViewStatus.UNVIEWED, loadAddress: false });
        const { total } = await qb.clone().select('count(DISTINCT e.id)', 'total').getRawOne();
        return Number(total);
    }

    createQuery(options: UserNotificationsQueryOptions, alias = 'e'): SelectQueryBuilder<UserNotification> {
        const { userId, viewStatus } = options;
        const qb = buildNotificationsBaseQuery(this.entityManager, options, alias);

        qb.innerJoin(NotificationTarget, `${alias}_nt`, `${alias}_nt.notification=${alias}.id`);
        qb.leftJoin(
            PropertyUnitOccupant,
            `${alias}_oc`,
            `(
                ${alias}_nt.type=:tenureRecipientType
                AND ${alias}_oc.tenure=${alias}_nt.tenureId
                AND ${alias}_oc.user=:userId
                AND (${alias}_nt.occupantType IS NULL OR ${alias}_oc.type=${alias}_nt.occupantType)
            )`,
        );
        qb.andWhere(
            new Brackets((q) =>
                q
                    .where(`(${alias}_nt.type=:userRecipientType AND ${alias}_nt.userId = :userId)`)
                    .orWhere(`${alias}_oc.id IS NOT NULL`),
            ),
            {
                userId,
                userRecipientType: NotificationRecipientType.USER,
                tenureRecipientType: NotificationRecipientType.TENURE,
            },
        );

        return applyRecipientFilters(qb, { userId, viewStatus }, alias);
    }

    async fetchResults(qb: SelectQueryBuilder<UserNotification>, options: { limit: number; offset?: number }, alias = 'e') {
        return fetchNotificationResults(qb, options, alias);
    }
}
