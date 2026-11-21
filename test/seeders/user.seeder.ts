import { randomUUID } from 'crypto';
import * as faker from 'faker';
import { EntityManager } from 'typeorm';
import { PortalUser } from '../../src/app/data/entities/external/portal-user.entity';

export const createUser = async ({
    entityManager,
    emailAddress,
    emailAddressVerified,
}: {
    entityManager: EntityManager;
    emailAddress?: string;
    emailAddressVerified?: boolean;
}) => {
    const entity = new PortalUser();
    entity.userId = randomUUID();
    entity.displayName = faker.address.country();
    entity.firstName = faker.name.firstName();
    entity.lastName = faker.name.lastName();
    entity.emailAddress = emailAddress || faker.internet.email();
    entity.emailAddressVerified = emailAddressVerified;
    return entityManager.save(entity);
};
