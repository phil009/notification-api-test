import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { PaymentApiCustomerApiResponse, PaymentApiCustomerApiResponseTypeEnum } from '../../../../sdk/payment-api-sdk';
import { Customer } from '../../../data/entities/external/payment/customer.entity';
import { PortalUser } from '../../../data/entities/external/portal-user.entity';
import { Workspace } from '../../../data/entities/external/workspace/workspace.entity';

@Injectable()
export class CustomerService {
    constructor(private entityManager: EntityManager) { }

    @Transactional()
    async create(data: PaymentApiCustomerApiResponse): Promise<Customer> {
        const entity = new Customer();
        entity.id = data.id.toString();
        await this.update(entity, data);
        return entity;
    }

    @Transactional()
    async update(entity: Customer, data: PaymentApiCustomerApiResponse): Promise<void> {
        entity.id = data.id;
        entity.type = data.type;
        entity.reference = data.reference;

        if (data.type === PaymentApiCustomerApiResponseTypeEnum.User) {
            entity.user = {
                userId: data.reference,
            } as PortalUser;
        }
        if (data.type === PaymentApiCustomerApiResponseTypeEnum.Organisation) {
            entity.workspace = {
                id: data.reference,
            } as Workspace;
        }

        entity.audit.version = data.version;

        await this.entityManager.save(entity);
    }
}
