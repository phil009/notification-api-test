import { Injectable } from '@matchmakerjs/di';
import { Brackets, EntityManager, SelectQueryBuilder } from 'typeorm';
import { PropertyUnitOccupant } from '../data/entities/external/tenure/property-unit-occupant.entity';
import { WorkspaceMember } from '../data/entities/external/workspace/workspace-member.entity';
import { NotificationRecipient } from '../data/entities/notification-recipient.entity';
import { NotificationTarget } from '../data/entities/notification-target.entity';
import { Notification, UserNotification } from '../data/entities/notification.entity';
import { NotificationRecipientType } from '../data/enums/notification-recipient-type.enum';
import { NotificationType } from '../data/enums/notification-type.enum';

export enum ViewStatus {
    VIEWED = 'VIEWED',
    UNVIEWED = 'UNVIEWED',
    ALL = 'ALL',
}

type CreateQueryOptions = {
    id?: string[];
    not?: string[];
    workspaceId?: string;
    propertyUnitId?: string;
    tenureId?: string;
    userId?: string;
    type?: NotificationType[];
    qb?: SelectQueryBuilder<UserNotification>;
    loadAddress: boolean;
    viewStatus: ViewStatus;
};

@Injectable()
export class NotificationDao {
    constructor(private entityManager: EntityManager) {}

    async countUnviewedNotifications(userId: string, workspaceId?: string): Promise<number> {
        const qb = this.createQuery({
            userId,
            workspaceId,
            viewStatus: ViewStatus.UNVIEWED,
            loadAddress: false,
        });
        const { total } = await qb.clone().select('count(DISTINCT e.id)', 'total').getRawOne();
        return Number(total);
    }

    createQuery(
        {
            id,
            not,
            userId,
            type,
            loadAddress,
            workspaceId,
            // propertyUnitId,
            // tenureId,
            viewStatus,
            qb: _qb,
        }: CreateQueryOptions,
        alias = 'e',
    ) {
        const qb = _qb || this.entityManager.createQueryBuilder(UserNotification, alias);
        qb.leftJoinAndSelect(`${alias}.walletTransaction`, `${alias}_wt`);

        qb.leftJoinAndSelect(`${alias}.offlinePayment`, `${alias}_op`);
        qb.leftJoinAndSelect(`${alias}_op.workspace`, `${alias}_op_w`);

        // qb.leftJoinAndSelect(`${alias}.tenureServiceCharge`, `${alias}_tsc`);
        // qb.leftJoinAndSelect(`${alias}_tsc.tenure`, `${alias}_t`);
        // qb.leftJoinAndSelect(`${alias}_t.propertyUnit`, `${alias}_pu`);
        // qb.leftJoinAndSelect(`${alias}_pu.type`, `${alias}_pt`);

        // qb.leftJoinAndSelect(`${alias}.electricityUnitPurchase`, `${alias}_eup`);
        // qb.leftJoinAndSelect(`${alias}_eup.meter`, `${alias}_em`);
        // qb.leftJoinAndSelect(`${alias}_em.provider`, `${alias}_emp`);
        qb.leftJoin(`${alias}.electricityUnitPurchase`, `${alias}_eup`);
        qb.andWhere(`${alias}_eup.id IS NULL`);

        if (loadAddress) {
            // qb.leftJoinAndSelect(`${alias}_pu.address`, `${alias}_address`);
            // qb.leftJoinAndSelect(`${alias}_address.lga`, `${alias}_lga`);
            // qb.leftJoinAndSelect(`${alias}_lga.state`, `${alias}_state`);
            // qb.leftJoinAndSelect(`${alias}_state.country`, `${alias}_country`);
        }
        // if (workspaceId) {
        //     qb.andWhere(`${alias}_pt.workspaceId = :workspaceId`, { workspaceId });
        // }
        // if (propertyUnitId) {
        //     qb.andWhere(`${alias}_pu.id = :propertyUnitId`, { propertyUnitId });
        // }
        // if (tenureId) {
        //     qb.andWhere(`${alias}_t.id = :tenureId`, { tenureId });
        // }
        if (id) {
            qb.andWhere(`${alias}.id IN (:...id)`, { id });
        }
        if (not) {
            qb.andWhere(`${alias}.id NOT IN (:...excluded)`, { excluded: not });
        }
        if (userId) {
            qb.innerJoin(NotificationTarget, `${alias}_nt`, `${alias}_nt.notification=${alias}.id`);
            if (workspaceId) {
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
            } else {
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
            }
            qb.leftJoin(
                NotificationRecipient,
                `${alias}_nr`,
                `${alias}_nr.notification=${alias}.id AND ${alias}_nr.userId=:userId`,
            );
            if (viewStatus) {
                switch (viewStatus) {
                    case 'VIEWED':
                        qb.andWhere(`${alias}_nr.id IS NOT NULL`);
                        break;
                    case 'UNVIEWED':
                        qb.andWhere(`${alias}_nr.id IS NULL`);
                        break;
                }
            }
            qb.addSelect(`${alias}_nr.firstViewedAt`, `${alias}_first_viewed_at`);
        }
        if (type?.length) {
            qb.andWhere(`${alias}.type IN (:...notificationType)`, { notificationType: type });
        }

        return qb;
    }

    async fetchResults(
        qb: SelectQueryBuilder<UserNotification>,
        {
            limit,
            offset,
        }: {
            limit: number;
            offset?: number;
            order?: string[];
        },
        alias = 'e',
    ) {
        qb.addOrderBy(`${alias}.createdAt`, 'DESC');
        return qb
            .limit(limit)
            .offset(offset || 0)
            .getMany();
    }

    async findNotificationById(id: string) {
        return this.entityManager.findOne(Notification, {
            id: id,
        });
    }

    async findNotificationBySource({ type, sourceReference }: { sourceReference: string; type: NotificationType }) {
        return this.entityManager.findOne(Notification, {
            type,
            sourceReference,
        });
    }
}

export type BaseNotificationsQueryOptions = {
    id?: string[];
    not?: string[];
    type?: NotificationType[];
    qb?: SelectQueryBuilder<UserNotification>;
    loadAddress: boolean;
    viewStatus: ViewStatus;
};

export function buildNotificationsBaseQuery(
    entityManager: EntityManager,
    { id, not, type, loadAddress, qb: _qb }: BaseNotificationsQueryOptions,
    alias: string,
): SelectQueryBuilder<UserNotification> {
    const qb = _qb || entityManager.createQueryBuilder(UserNotification, alias);
    qb.leftJoinAndSelect(`${alias}.walletTransaction`, `${alias}_wt`);

    qb.leftJoinAndSelect(`${alias}.offlinePayment`, `${alias}_op`);
    qb.leftJoinAndSelect(`${alias}_op.workspace`, `${alias}_op_w`);

    qb.leftJoin(`${alias}.electricityUnitPurchase`, `${alias}_eup`);
    qb.andWhere(`${alias}_eup.id IS NULL`);

    if (loadAddress) {
        // qb.leftJoinAndSelect(`${alias}_pu.address`, `${alias}_address`);
        // qb.leftJoinAndSelect(`${alias}_address.lga`, `${alias}_lga`);
        // qb.leftJoinAndSelect(`${alias}_lga.state`, `${alias}_state`);
        // qb.leftJoinAndSelect(`${alias}_state.country`, `${alias}_country`);
    }
    if (id) {
        qb.andWhere(`${alias}.id IN (:...id)`, { id });
    }
    if (not) {
        qb.andWhere(`${alias}.id NOT IN (:...excluded)`, { excluded: not });
    }
    if (type?.length) {
        qb.andWhere(`${alias}.type IN (:...notificationType)`, { notificationType: type });
    }
    return qb;
}

export function applyRecipientFilters(
    qb: SelectQueryBuilder<UserNotification>,
    { userId, viewStatus }: { userId: string; viewStatus: ViewStatus },
    alias: string,
): SelectQueryBuilder<UserNotification> {
    qb.leftJoin(
        NotificationRecipient,
        `${alias}_nr`,
        `${alias}_nr.notification=${alias}.id AND ${alias}_nr.userId=:userId`,
        { userId },
    );
    if (viewStatus) {
        switch (viewStatus) {
            case 'VIEWED':
                qb.andWhere(`${alias}_nr.id IS NOT NULL`);
                break;
            case 'UNVIEWED':
                qb.andWhere(`${alias}_nr.id IS NULL`);
                break;
        }
    }
    qb.addSelect(`${alias}_nr.firstViewedAt`, `${alias}_first_viewed_at`);
    return qb;
}

export async function fetchNotificationResults(
    qb: SelectQueryBuilder<UserNotification>,
    { limit, offset }: { limit: number; offset?: number },
    alias = 'e',
) {
    qb.addOrderBy(`${alias}.createdAt`, 'DESC');
    return qb
        .limit(limit)
        .offset(offset || 0)
        .getMany();
}
