import { Injectable } from '@matchmakerjs/di';
import { EntityManager } from 'typeorm';
import { DateUtils } from '../../utils/date-util';
import { PropertyUnitTenure } from '../data/entities/external/tenure/property-unit-tenure.entity';

@Injectable()
export class PropertyUnitTenureDao {
    constructor(private entityManager: EntityManager) {}

    getExpiringTenuresToNotify(
        now: Date,
        limit: number,
        options?: {
            skip?: PropertyUnitTenure[];
            lastNotifiedBefore: Date;
        },
    ): Promise<PropertyUnitTenure[]> {
        const { skip, lastNotifiedBefore } = options || {};
        const qb = this.entityManager
            .createQueryBuilder(PropertyUnitTenure, 'e')
            .setParameter('now', DateUtils.toSql(now));

        qb.innerJoinAndSelect('e.propertyUnit', 'pu');
        qb.leftJoinAndSelect('pu.location', 'l');

        qb.leftJoinAndSelect('l.owner', 'po');
        qb.leftJoinAndSelect('po.workspace', 'po_w');

        qb.leftJoinAndSelect('l.workspace', 'l_w');

        qb.leftJoinAndSelect('l.address', 'address');
        qb.leftJoinAndSelect('address.lga', 'lga');
        qb.leftJoinAndSelect('lga.state', 'state');
        qb.leftJoinAndSelect('state.country', 'country');

        qb.andWhere('e.expiryNoticeAt <= :now');
        qb.andWhere('e.endedAt > :now');

        if (skip?.length) {
            qb.andWhere('e.id NOT IN (:...skip)', { skip: skip.map((it) => it.id) });
        }

        if (lastNotifiedBefore) {
            qb.andWhere(
                '(e.lastExpiryNotificationAt IS NULL OR e.lastExpiryNotificationAt < :lastNotifiedBefore)',
                { lastNotifiedBefore: DateUtils.toSql(lastNotifiedBefore) },
            );
        }

        return qb.distinct().limit(limit).getMany();
    }
}
