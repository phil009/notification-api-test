import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { UserAccountApiResponse } from '../../../sdk/account-api-sdk';
import { PortalUser } from '../../data/entities/external/portal-user.entity';

@Injectable()
export class PortalUserRegistrationService {
    constructor(private entityManager: EntityManager) {}

    @Transactional()
    async createUser(userData: UserAccountApiResponse): Promise<PortalUser> {
        const user = new PortalUser();
        user.userId = userData.userId;
        await this.updateUser(user, userData);
        return user;
    }

    @Transactional()
    async updateUser(user: PortalUser, userData: UserAccountApiResponse): Promise<void> {
        user.displayName = userData.displayName;
        user.firstName = userData.firstName;
        user.lastName = userData.lastName;

        user.emailAddress = userData.emailAddress;
        user.emailAddressVerified = userData.emailAddressVerified;
        user.phoneNumber = userData.phoneNumber;

        user.audit.createdAt = userData.createdAt && new Date(userData.createdAt);
        user.audit.lastUpdatedAt = userData.lastUpdatedAt && new Date(userData.lastUpdatedAt);
        user.audit.receivedAt = new Date();
        await this.entityManager.save(user);
    }
}
