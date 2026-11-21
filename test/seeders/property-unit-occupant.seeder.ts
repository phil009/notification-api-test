import { randomUUID } from 'crypto';
import { EntityManager } from 'typeorm';
import { PortalUser } from '../../src/app/data/entities/external/portal-user.entity';
import { PropertyUnitOccupant } from '../../src/app/data/entities/external/tenure/property-unit-occupant.entity';
import { PropertyUnitTenure } from '../../src/app/data/entities/external/tenure/property-unit-tenure.entity';
import { OccupantApiResponseTypeEnum } from '../../src/sdk/occupant-api-sdk';
import * as faker from 'faker';

export const createPropertyUnitOccupant = async ({
    entityManager,
    tenure,
    user,
    type,
    emailAddress,
}: {
    entityManager: EntityManager;
    tenure: PropertyUnitTenure;
    user?: PortalUser;
    type: OccupantApiResponseTypeEnum;
    emailAddress?: string;
}) => {
    const entity = new PropertyUnitOccupant();
    entity.id = randomUUID();
    entity.tenure = tenure;
    entity.user = user;
    entity.type = type;
    entity.emailAddress = emailAddress;
    entity.firstName = faker.name.firstName();
    entity.lastName = faker.name.lastName();
    return entityManager.save(entity);
};
