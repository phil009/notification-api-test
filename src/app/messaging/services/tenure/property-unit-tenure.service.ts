import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { TenureApiResponse } from '../../../../sdk/occupant-api-sdk';
import { PropertyUnit } from '../../../data/entities/external/property/property-unit.entity';
import { PropertyUnitTenure } from '../../../data/entities/external/tenure/property-unit-tenure.entity';

@Injectable()
export class PropertyUnitTenureService {
    constructor(private entityManager: EntityManager) {}

    @Transactional()
    async create(data: TenureApiResponse): Promise<PropertyUnitTenure> {
        const entity = new PropertyUnitTenure();
        entity.id = data.id;
        return this.update(entity, data);
    }

    @Transactional()
    async update(entity: PropertyUnitTenure, data: TenureApiResponse): Promise<PropertyUnitTenure> {
        const unit = new PropertyUnit();
        unit.id = data.propertyUnit.id;
        entity.propertyUnit = unit;
        entity.startedAt = data.startedAt && new Date(data.startedAt);
        entity.endedAt = data.endedAt && new Date(data.endedAt);

        entity.audit.version = data.version;
        entity.audit.createdAt = data.createdAt && new Date(data.createdAt);
        return this.entityManager.save(entity);
    }
}
