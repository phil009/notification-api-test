import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { ElectricityMeterApiResponse, VendingApiCustomerApiResponseTypeEnum } from '../../../../sdk/vending-api-sdk';
import { ElectricityMeterProvider } from '../../../data/entities/external/electricity/electricity-meter-provider.entity';
import { ElectricityMeter } from '../../../data/entities/external/electricity/electricity-meter.entity';
import { PortalUser } from '../../../data/entities/external/portal-user.entity';

@Injectable()
export class ElectricityMeterService {
    constructor(private entityManager: EntityManager) {}

    @Transactional()
    async create(data: ElectricityMeterApiResponse): Promise<ElectricityMeter> {
        const entity = new ElectricityMeter();
        entity.id = data.id.toString();
        await this.update(entity, data);
        return entity;
    }

    @Transactional()
    async update(entity: ElectricityMeter, data: ElectricityMeterApiResponse): Promise<void> {
        const provider = new ElectricityMeterProvider();
        provider.id = data.provider.id;

        entity.provider = provider;
        entity.meterNumber = data.meterNumber;
        entity.meterName = data.meterName;
        entity.address = data.address;
        entity.phoneNumber = data.phoneNumber;

        if (data.customer.type === VendingApiCustomerApiResponseTypeEnum.User) {
            const portalUser = new PortalUser();
            portalUser.userId = data.customer.reference;
            entity.portalUser = portalUser;
        }

        entity.audit.version = data.version;

        await this.entityManager.save(entity);
    }
}
