import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { PropertyUnitApiResponse } from '../../../../sdk/property-api-sdk';
import { PROPERTY_UNIT_TOPIC } from '../../../constants/topics.constant';
import { PropertyUnit } from '../../../data/entities/external/property/property-unit.entity';
import { PropertyUnitService } from '../../services/property/property-unit.service';

@Injectable()
export class PropertyUnitMessageListener implements MessageListener {
    constructor(private entityManager: EntityManager, private propertyUnitService: PropertyUnitService) {}

    @Activity('PROPERTY UNIT NOTIFICATION')
    async processMessage(message: Buffer): Promise<void> {
        const dto: PropertyUnitApiResponse = JSON.parse(message.toString());

        const entity = await this.entityManager.getRepository(PropertyUnit).findOne({
            where: { id: dto.id },
            withDeleted: true
        });
        if (!entity) {
            await this.propertyUnitService.createPropertyUnit(dto);
        } else {
            await this.propertyUnitService.updatePropertyUnit(entity, dto);
        }
    }

    getTopic(): string {
        return PROPERTY_UNIT_TOPIC;
    }
}
