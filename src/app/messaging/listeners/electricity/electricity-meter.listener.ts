import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { ElectricityMeterApiResponse } from '../../../../sdk/vending-api-sdk';
import { ELECTRICITY_METER_TOPIC } from '../../../constants/topics.constant';
import { ElectricityMeter } from '../../../data/entities/external/electricity/electricity-meter.entity';
import { ElectricityMeterService } from '../../services/electricity/electricity-meter.service';

@Injectable()
export class ElectricityMeterMessageListener implements MessageListener {
    constructor(private entityManager: EntityManager, private electricityMeterService: ElectricityMeterService) {}

    @Activity('ELECTRICITY METER NOTIFICATION')
    async processMessage(message: Buffer): Promise<void> {
        const dto: ElectricityMeterApiResponse = JSON.parse(message.toString());

        const entity = await this.entityManager.getRepository(ElectricityMeter).findOne(dto.id);

        if (!entity) {
            await this.electricityMeterService.create(dto);
        } else if (entity.audit.version <= dto.version) {
            await this.electricityMeterService.update(entity, dto);
        }
    }

    getTopic(): string {
        return ELECTRICITY_METER_TOPIC;
    }
}
