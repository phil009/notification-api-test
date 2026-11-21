import { randomUUID } from 'crypto';
import { EntityManager } from 'typeorm';
import { PropertyUnit } from '../../src/app/data/entities/external/property/property-unit.entity';
import { PropertyUnitTenure } from '../../src/app/data/entities/external/tenure/property-unit-tenure.entity';

export const createPropertyUnitTenure = async ({
    entityManager,
    unit,
}: {
    entityManager: EntityManager;
    unit?: PropertyUnit;
}) => {
    const entity = new PropertyUnitTenure();
    entity.id = randomUUID();
    if (unit) {
        entity.propertyUnit = unit;
    } else {
        const temp = new PropertyUnit();
        temp.id = randomUUID();
        entity.propertyUnit = temp;
    }
    return entityManager.save(entity);
};
