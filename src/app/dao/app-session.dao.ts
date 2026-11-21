import { Injectable } from '@matchmakerjs/di';
import { EntityManager } from 'typeorm';
import { DateUtils } from '../../utils/date-util';
import { AppSession } from '../data/entities/app-session.entity';

@Injectable()
export class AppSessionDao {
    constructor(private entityManager: EntityManager) {}

    async getLatest({ userId, appIds }: { userId: string; appIds: string[] }): Promise<AppSession> {
        if (!appIds?.length) return Promise.resolve(null);
        return this.entityManager
            .createQueryBuilder(AppSession, 'e')
            .andWhere('e.userId = :userId', { userId })
            .andWhere('e.applicationId IN (:...appIds)', { appIds })
            .andWhere('e.endedAt IS NULL')
            .andWhere('(e.expiresAt IS NULL OR e.expiresAt > :now)', { now: DateUtils.toSql(new Date()) })
            .orderBy('e.startedAt', 'DESC')
            .limit(1)
            .getOne();
    }
}
