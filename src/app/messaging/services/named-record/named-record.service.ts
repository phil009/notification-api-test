import { Injectable } from '@matchmakerjs/di';
import { ErrorResponse } from '@matchmakerjs/matchmaker';
import { Transactional } from '@matchmakerjs/matchmaker-typeorm';
import { EntityManager } from 'typeorm';
import { NamedRecordRelationship } from '../../../data/entities/external/named-record/named-record-relationship.entity';
import { NamedRecord } from '../../../data/entities/external/named-record/named-record.entity';
import { NamedRecordRelationshipService } from './named-record-relationship.service';

@Injectable()
export class NamedRecordService {
    constructor(private entityManager: EntityManager, private relationshipService: NamedRecordRelationshipService) {}

    @Transactional()
    async deleteRecordRelationships(id: string): Promise<void> {
        await this.entityManager
            .createQueryBuilder(NamedRecordRelationship, 'r')
            .where('source = :id', { id })
            .delete()
            .callListeners(false)
            .execute();
    }

    async getCategories(ids: string[]): Promise<NamedRecord[]> {
        if (!ids?.length) {
            return [];
        }
        return this.entityManager.createQueryBuilder(NamedRecord, 'l').where('l.id IN (:...ids)', { ids }).getMany();
    }

    async loadFully(records: NamedRecord[]) {
        if (!records?.length) return;

        const ancestors = await this.relationshipService.getAncestors(records.map((it) => it.id));
        const sibblings = await this.relationshipService.getChildren(
            ancestors.filter((it) => it.distance === 0).map((it) => it.target.id),
        );

        // const childrenCounts =
        //   await this.relationshipService.countChildren(
        //     records.map((it) => it.id)
        //   );

        records.forEach((item) => {
            // item.numberOfChildren = Number(childrenCounts[item.id] || 0);
            item.ancestors = ancestors
                .filter((it) => it.source.id === item.id)
                .sort((a, b) => a.distance - b.distance)
                .map((it) => it.target);
            for (let i = 0; i < item.ancestors.length - 1; i++) {
                item.ancestors[i].parentId = item.ancestors[i + 1].id;
            }
            if (item.ancestors?.length) {
                item.parentId = item.ancestors[0].id;
                item.sibblings = sibblings
                    .filter((it) => it.source.id !== item.id && it.target.id === item.ancestors[0].id)
                    .map((it) => {
                        it.source.parentId = it.target.id;
                        return it.source;
                    });
            }
        });
    }

    async getRecordOrThrow(id: string, errorMessage: string) {
        const documentType = await this.entityManager.findOne(NamedRecord, { id });
        if (!documentType) {
            throw new ErrorResponse(400, {
                message: errorMessage,
            });
        }
        return documentType;
    }
}
