import { DIContainer, Inject, Injectable, InjectionToken } from '@matchmakerjs/di';
import { EntityManager } from 'typeorm';
import { NamedRecordRelationship } from '../../../data/entities/external/named-record/named-record-relationship.entity';

@Injectable()
export class NamedRecordRelationshipService {
    constructor(
        private entityManager: EntityManager,
        @Inject(InjectionToken.container) private container: DIContainer,
    ) {}

    async getLineage(ids: string[]): Promise<NamedRecordRelationship[]> {
        if (!ids?.length) {
            return [];
        }
        return this.entityManager
            .createQueryBuilder(NamedRecordRelationship, 'a_c')
            .innerJoinAndSelect('a_c.target', 'a')
            .innerJoinAndSelect('a_c.source', 'c')
            .leftJoinAndSelect('a_c.derivedFrom', 'df')
            .where('(df.id IS NULL OR df.deactivatedAt IS NULL)')
            .andWhere('(a.id IN (:...ids) OR c.id IN (:...ids))', { ids })
            .orderBy('a_c.distance', 'ASC')
            .getMany();
    }

    async getAncestors(ids: string[]): Promise<NamedRecordRelationship[]> {
        if (!ids?.length) {
            return [];
        }
        return this.entityManager
            .createQueryBuilder(NamedRecordRelationship, 'a_c')
            .innerJoinAndSelect('a_c.target', 'a')
            .innerJoinAndSelect('a_c.source', 'c')
            .andWhere('c.id IN (:...ids)', { ids })
            .orderBy('a_c.distance', 'ASC')
            .getMany();
    }

    async getParents(ids: string[]): Promise<NamedRecordRelationship[]> {
        if (!ids?.length) {
            return;
        }
        return this.entityManager
            .createQueryBuilder(NamedRecordRelationship, 'a_c')
            .innerJoinAndSelect('a_c.target', 'a')
            .innerJoinAndSelect('a_c.source', 'c')
            .where('a_c.distance=0')
            .andWhere('c.id IN (:...ids)', { ids })
            .getMany();
    }

    async getChildren(ids: string[]): Promise<NamedRecordRelationship[]> {
        if (!ids?.length) {
            return;
        }
        return this.entityManager
            .createQueryBuilder(NamedRecordRelationship, 'a_c')
            .innerJoinAndSelect('a_c.target', 'a')
            .innerJoinAndSelect('a_c.source', 'c')
            .where('a_c.distance=0')
            .andWhere('a.id IN (:...ids)', { ids })
            .getMany();
    }

    async countChildren(ids: string[]): Promise<{ [key: string]: number }> {
        const response: { [key: string]: number } = {};
        if (!ids?.length) {
            return response;
        }
        const results = await this.entityManager
            .createQueryBuilder(NamedRecordRelationship, 'a_c')
            .innerJoinAndSelect('a_c.target', 'a')
            .innerJoinAndSelect('a_c.source', 'c')
            .where('a_c.distance=0')
            .andWhere('a.id IN (:...ids)', { ids })
            .select('a.id', 'id')
            .addSelect('COUNT(DISTINCT c.id)', 'value')
            .groupBy('a.id')
            .getRawMany<{ id: string; value: number }>();
        results.forEach((it) => (response[it.id] = it.value));
        return response;
    }
}
