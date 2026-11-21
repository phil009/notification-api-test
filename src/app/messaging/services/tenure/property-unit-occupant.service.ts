import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { OccupantApiResponse } from '../../../../sdk/occupant-api-sdk';
import { PortalUser } from '../../../data/entities/external/portal-user.entity';
import { PropertyUnitOccupant } from '../../../data/entities/external/tenure/property-unit-occupant.entity';
import { PropertyUnitTenure } from '../../../data/entities/external/tenure/property-unit-tenure.entity';

@Injectable()
export class PropertyUnitOccupantService {
    constructor(private entityManager: EntityManager) {}

    @Transactional()
    async create(data: OccupantApiResponse): Promise<PropertyUnitOccupant> {
        const entity = new PropertyUnitOccupant();
        entity.id = data.id;
        return this.update(entity, data);
    }

    @Transactional()
    async update(entity: PropertyUnitOccupant, data: OccupantApiResponse): Promise<PropertyUnitOccupant> {
        const tenure = new PropertyUnitTenure();
        tenure.id = data.tenure.id;
        entity.tenure = tenure;
        entity.user =
            data.userId &&
            ({
                userId: data.userId,
            } as PortalUser);
        entity.title = data.title;
        entity.firstName = data.firstName;
        entity.lastName = data.lastName;
        entity.phoneNumber = data.phoneNumber;
        entity.emailAddress = data.emailAddress;
        entity.type = data.type;
        entity.audit.version = data.version;
        return this.entityManager.save(entity);
    }
}
