import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { ElectricityMeterProviderApiResponse } from '../../../../sdk/vending-api-sdk';
import { ElectricityMeterProvider } from '../../../data/entities/external/electricity/electricity-meter-provider.entity';

@Injectable()
export class ElectricityMeterProviderService {
    constructor(private entityManager: EntityManager) {}

    @Transactional()
    async create(data: ElectricityMeterProviderApiResponse): Promise<ElectricityMeterProvider> {
        const entity = new ElectricityMeterProvider();
        entity.id = data.id.toString();
        await this.update(entity, data);
        return entity;
    }

    @Transactional()
    async update(entity: ElectricityMeterProvider, data: ElectricityMeterProviderApiResponse): Promise<void> {
        entity.vendor = data.vendor;
        entity.providerId = data.providerId;
        entity.name = data.name;

        entity.audit.version = data.version;

        await this.entityManager.save(entity);
    }
}
