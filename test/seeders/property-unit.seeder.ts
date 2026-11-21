import { randomUUID } from 'crypto';
import { EntityManager } from 'typeorm';
import { ElectricityMeter } from '../../src/app/data/entities/external/electricity/electricity-meter.entity';
import { PropertyUnit } from '../../src/app/data/entities/external/property/property-unit.entity';
import { Property } from '../../src/app/data/entities/external/property/property.entity';

export const createPropertyUnit = async ({
    entityManager,
    workspaceId,
    location,
    unitNumber,
    // description,
    // electricityMeter,
    createdAt,
}: {
    entityManager: EntityManager;
    workspaceId?: string;
    location?: Property;
    unitNumber?: string;
    description?: string;
    electricityMeter?: ElectricityMeter;
    createdAt?: Date;
}) => {
    const entity = new PropertyUnit();
    entity.id = randomUUID();
    entity.referenceCode = randomUUID();
    entity.workspaceId = workspaceId;
    entity.location = location;
    entity.unitNumber = unitNumber;
    // entity.description = description;
    // entity.electricityMeter = electricityMeter;
    entity.audit.createdAt = createdAt;
    return entityManager.save(entity);
};
