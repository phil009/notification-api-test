import { Injectable } from '@matchmakerjs/di';
import { Brackets, EntityManager } from 'typeorm';
import { OccupantApiResponseTypeEnum } from '../../sdk/occupant-api-sdk';
import { DateUtils } from '../../utils/date-util';
import { TenureLedger } from '../data/entities/external/ledger/tenure/tenure-ledger.entity';
import { PropertyOwner } from '../data/entities/external/property/property-owner.entity';
import { Property } from '../data/entities/external/property/property.entity';
import { PropertyUnitOccupant } from '../data/entities/external/tenure/property-unit-occupant.entity';
import { PropertyUnitTenure } from '../data/entities/external/tenure/property-unit-tenure.entity';

@Injectable()
export class PropertyUnitOccupantDao {
    constructor(private entityManager: EntityManager) {}

    getByTenureAndType(
        tenures: PropertyUnitTenure[],
        types?: OccupantApiResponseTypeEnum[],
    ): Promise<PropertyUnitOccupant[]> {
        const qb = this.entityManager
            .createQueryBuilder(PropertyUnitOccupant, 'e')
            .innerJoinAndSelect('e.tenure', 't')
            .innerJoinAndSelect('e.user', 'u')
            .where('t.id IN (:...tenureIds)', { tenureIds: tenures.map((it) => it.id) });
        if (types.length) {
            qb.andWhere('e.type IN (:...types)', { types });
        }
        return qb.getMany();
    }

    getDefaultingOccupantsForManagerToNotify(
        now: Date,
        limit: number,
        options?: {
            skip?: PropertyUnitOccupant[];
            lastNotifiedBefore: Date;
        },
    ): Promise<PropertyUnitOccupant[]> {
        const { skip, lastNotifiedBefore } = options || {};
        const qb = this.entityManager
            .createQueryBuilder(PropertyUnitOccupant, 'e')
            .setParameter('now', DateUtils.toSql(now));
        qb.innerJoinAndSelect('e.tenure', 't');
        qb.innerJoinAndSelect('t.propertyUnit', 'pu');
        qb.leftJoinAndSelect('pu.location', 'l');
        qb.leftJoinAndSelect('l.owner', 'p_owner');

        // qb.leftJoinAndSelect('l.owner', 'po');
        qb.leftJoin(
            Property,
            `p_root`,
            `p_root.deactivatedAt IS NULL AND p_root.supersets IS NULL AND p_root.id = ANY(l.supersets)`,
        );
        qb.innerJoin(
            PropertyOwner,
            `po`,
            `po.deactivatedAt IS NULL AND (p_root.owner=po.id OR l.owner=po.id)`,
        );
        // qb.leftJoinAndSelect('po.workspace', 'po_w');

        // qb.leftJoinAndSelect('l.workspace', 'l_w');

        qb.leftJoinAndSelect('l.address', 'address');
        qb.leftJoinAndSelect('address.lga', 'lga');
        qb.leftJoinAndSelect('lga.state', 'state');
        qb.leftJoinAndSelect('state.country', 'country');

        qb.andWhere('e.type IN (:...OCCUPANT_TYPES)', {
            OCCUPANT_TYPES: [OccupantApiResponseTypeEnum.Primary, OccupantApiResponseTypeEnum.CoTenant],
        });

        qb.innerJoinAndSelect(TenureLedger, 'tl', 'tl.tenure=t.id');
        qb.andWhere('tl.defaultedAt <= :now');

        if (skip?.length) {
            qb.andWhere('e.id NOT IN (:...skip)', {
                skip: skip.map((it) => it.id),
            });
        }
        if (lastNotifiedBefore) {
            qb.andWhere(
                new Brackets((q) =>
                    q
                        .where('e.lastManagerNotificationAt IS NULL')
                        .orWhere('e.lastManagerNotificationAt < :lastNotifiedBefore'),
                ),
                {
                    lastNotifiedBefore: DateUtils.toSql(lastNotifiedBefore),
                },
            );
        }
        return qb.distinct().limit(limit).getMany();
    }

    /**
     * Like {@link getDefaultingOccupantsForManagerToNotify}, but returns one row per defaulting
     * tenure (the primary occupant) rather than one per occupant, so a tenure with co-tenants
     * doesn't produce duplicate rows when building a per-workspace summary.
     */
    getDefaultingOccupantsForManagerSummary(
        now: Date,
        limit: number,
        options?: {
            skip?: PropertyUnitOccupant[];
            lastNotifiedBefore: Date;
        },
    ): Promise<PropertyUnitOccupant[]> {
        const { skip, lastNotifiedBefore } = options || {};
        const qb = this.entityManager
            .createQueryBuilder(PropertyUnitOccupant, 'e')
            .setParameter('now', DateUtils.toSql(now));
        qb.innerJoinAndSelect('e.tenure', 't');
        qb.innerJoinAndSelect('t.propertyUnit', 'pu');
        qb.leftJoinAndSelect('pu.location', 'l');
        qb.leftJoinAndSelect('l.owner', 'p_owner');

        qb.leftJoin(
            Property,
            `p_root`,
            `p_root.deactivatedAt IS NULL AND p_root.supersets IS NULL AND p_root.id = ANY(l.supersets)`,
        );
        qb.innerJoin(
            PropertyOwner,
            `po`,
            `po.deactivatedAt IS NULL AND (p_root.owner=po.id OR l.owner=po.id)`,
        );

        qb.leftJoinAndSelect('l.address', 'address');
        qb.leftJoinAndSelect('address.lga', 'lga');
        qb.leftJoinAndSelect('lga.state', 'state');
        qb.leftJoinAndSelect('state.country', 'country');

        qb.andWhere('e.type = :PRIMARY', { PRIMARY: OccupantApiResponseTypeEnum.Primary });

        qb.innerJoinAndSelect(TenureLedger, 'tl', 'tl.tenure=t.id');
        qb.andWhere('tl.defaultedAt <= :now');

        if (skip?.length) {
            qb.andWhere('e.id NOT IN (:...skip)', {
                skip: skip.map((it) => it.id),
            });
        }
        if (lastNotifiedBefore) {
            qb.andWhere(
                new Brackets((q) =>
                    q
                        .where('e.lastManagerNotificationAt IS NULL')
                        .orWhere('e.lastManagerNotificationAt < :lastNotifiedBefore'),
                ),
                {
                    lastNotifiedBefore: DateUtils.toSql(lastNotifiedBefore),
                },
            );
        }
        return qb.distinct().limit(limit).getMany();
    }

    getOccupantsForRentDueReminder(
        now: Date,
        limit: number,
        options?: {
            skip?: PropertyUnitOccupant[];
            lastNotifiedBefore: Date;
        },
    ): Promise<PropertyUnitOccupant[]> {
        const { skip, lastNotifiedBefore } = options || {};
        const qb = this.entityManager
            .createQueryBuilder(PropertyUnitOccupant, 'e')
            .setParameter('now', DateUtils.toSql(now));
        qb.innerJoinAndSelect('e.user', 'u');
        qb.innerJoinAndSelect('e.tenure', 't');
        qb.innerJoinAndSelect('t.propertyUnit', 'pu');
        qb.leftJoinAndSelect('pu.location', 'l');

        qb.leftJoinAndSelect('l.owner', 'po');
        qb.leftJoinAndSelect('po.workspace', 'po_w');

        qb.leftJoinAndSelect('l.workspace', 'l_w');

        qb.leftJoinAndSelect('l.address', 'address');
        qb.leftJoinAndSelect('address.lga', 'lga');
        qb.leftJoinAndSelect('lga.state', 'state');
        qb.leftJoinAndSelect('state.country', 'country');

        qb.andWhere('e.type = :PRIMARY', { PRIMARY: OccupantApiResponseTypeEnum.Primary });
        qb.andWhere('t.endedAt IS NOT NULL');

        qb.andWhere(
            new Brackets((q) =>
                q
                    .where("DATE(t.endedAt) = DATE(:now) + interval '30 days'")
                    .orWhere("DATE(t.endedAt) = DATE(:now) + interval '7 days'")
                    .orWhere("DATE(t.endedAt) = DATE(:now) + interval '1 day'"),
            ),
        );

        if (skip?.length) {
            qb.andWhere('e.id NOT IN (:...skip)', {
                skip: skip.map((it) => it.id),
            });
        }
        if (lastNotifiedBefore) {
            qb.andWhere(
                new Brackets((q) =>
                    q
                        .where('e.lastRentDueReminderAt IS NULL')
                        .orWhere('e.lastRentDueReminderAt < :lastNotifiedBefore'),
                ),
                {
                    lastNotifiedBefore: DateUtils.toSql(lastNotifiedBefore),
                },
            );
        }
        return qb.distinct().limit(limit).getMany();
    }

    getDefaultingOccupantsToNotify(
        now: Date,
        limit: number,
        options?: {
            skip?: PropertyUnitOccupant[];
            lastNotifiedBefore: Date;
        },
    ): Promise<PropertyUnitOccupant[]> {
        const { skip, lastNotifiedBefore } = options || {};
        const qb = this.entityManager
            .createQueryBuilder(PropertyUnitOccupant, 'e')
            .setParameter('now', DateUtils.toSql(now));
        qb.innerJoinAndSelect('e.user', 'u');
        qb.innerJoinAndSelect('e.tenure', 't');
        qb.innerJoinAndSelect('t.propertyUnit', 'pu');
        qb.innerJoinAndSelect('pu.location', 'l');

        qb.leftJoinAndSelect('l.owner', 'l_po');
        qb.leftJoinAndSelect('l_po.workspace', 'l_po_w');

        qb.leftJoinAndSelect('l.address', 'address');
        qb.leftJoinAndSelect('address.lga', 'lga');
        qb.leftJoinAndSelect('lga.state', 'state');
        qb.leftJoinAndSelect('state.country', 'country');

        qb.leftJoin(
            Property,
            `p_root`,
            `p_root.deactivatedAt IS NULL AND p_root.supersets IS NULL AND p_root.id = ANY(l.supersets)`,
        );
        qb.innerJoin(
            PropertyOwner,
            `po`,
            `po.deactivatedAt IS NULL AND (p_root.owner=po.id OR l.owner=po.id)`,
        );

        // qb.andWhere('pu.tenuresBillable = true');
        qb.andWhere('e.type IN (:...OCCUPANT_TYPES)', {
            OCCUPANT_TYPES: [OccupantApiResponseTypeEnum.Primary, OccupantApiResponseTypeEnum.CoTenant],
        });

        qb.innerJoinAndSelect(TenureLedger, 'tl', 'tl.tenure=t.id');
        qb.andWhere('tl.defaultedAt <= :now');
        if (skip?.length) {
            qb.andWhere('e.id NOT IN (:...skip)', {
                skip: skip.map((it) => it.id),
            });
        }
        if (lastNotifiedBefore) {
            qb.andWhere(
                new Brackets((q) =>
                    q
                        .where('e.lastUnpaidBillNotificationAt IS NULL')
                        .orWhere('e.lastUnpaidBillNotificationAt < :lastNotifiedBefore'),
                ),
                {
                    lastNotifiedBefore: DateUtils.toSql(lastNotifiedBefore),
                },
            );
        }
        return qb.distinct().limit(limit).getMany();
    }
}
