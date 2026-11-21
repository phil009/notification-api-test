import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { ElectricityMeterProviderApiResponse } from '../../../../sdk/vending-api-sdk';
import { ELECTRICITY_METER_PROVIDER_TOPIC } from '../../../constants/topics.constant';
import { ElectricityMeterProvider } from '../../../data/entities/external/electricity/electricity-meter-provider.entity';
import { ElectricityMeterProviderService } from '../../services/electricity/electricity-meter-provider.service';

@Injectable()
export class ElectricityMeterProviderMessageListener implements MessageListener {
    constructor(
        private entityManager: EntityManager,
        private electricityMeterProviderService: ElectricityMeterProviderService,
    ) {}

    @Activity('ELECTRICITY METER PROVIDER NOTIFICATION')
    async processMessage(message: Buffer): Promise<void> {
        const dto: ElectricityMeterProviderApiResponse = JSON.parse(message.toString());

        const entity = await this.entityManager.getRepository(ElectricityMeterProvider).findOne(dto.id.toString());

        if (!entity) {
            await this.electricityMeterProviderService.create(dto);
        } else if (entity.audit.version <= dto.version) {
            await this.electricityMeterProviderService.update(entity, dto);
        }
    }

    getTopic(): string {
        return ELECTRICITY_METER_PROVIDER_TOPIC;
    }
}
