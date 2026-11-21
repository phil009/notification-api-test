import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { Lga } from '../../../data/entities/external/location/lga.entity';
import { State } from '../../../data/entities/external/location/state.entity';
import { NamedRecordRelationship } from '../../../data/entities/external/named-record/named-record-relationship.entity';
import { NamedRecord } from '../../../data/entities/external/named-record/named-record.entity';
import { LocationMessage, LocationType } from '../../messages/location.message';
import { NamedRecordService } from '../named-record/named-record.service';

@Injectable()
export class LgaService {
    constructor(private entityManager: EntityManager, private namedRecordService: NamedRecordService) {}

    @Transactional()
    async createLga(data: LocationMessage): Promise<Lga> {
        const entity = new Lga();
        entity.id = data.id;
        await this.updateLga(entity, data);
        return entity;
    }

    @Transactional()
    async updateLga(entity: Lga, data: LocationMessage): Promise<void> {
        const states = data.parents?.filter((it) => it.type === LocationType.STATE_OR_PROVINCE);
        if (states?.length === 1) {
            const state = new State();
            state.id = states[0].id;
            entity.state = state;
        } else {
            throw new Error(`State missing for lga ${data.code}`);
        }

        entity.name = data.name;
        entity.code = data.code;

        entity.audit.version = data.version;
        await this.entityManager.save(entity);
        const namedRecord = new NamedRecord();
        namedRecord.id = entity.id;
        await this.setItemAndRelationships(namedRecord, data.parents);
    }

    async setItemAndRelationships(
        descendant: NamedRecord,
        ancestors: LocationMessage[],
    ): Promise<NamedRecordRelationship[]> {
        await this.namedRecordService.deleteRecordRelationships(descendant.id);
        const relationships: NamedRecordRelationship[] = [];
        for (let i = 0; i < ancestors.length; i++) {
            const relationship = new NamedRecordRelationship();
            relationship.source = descendant;
            const ancestor = new NamedRecord();
            ancestor.id = ancestors[i].id;
            relationship.target = ancestor;
            await this.entityManager.save(relationship);
            relationships.push(relationship);
        }
        return relationships;
    }
}
