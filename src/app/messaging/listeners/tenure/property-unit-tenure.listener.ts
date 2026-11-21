import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { TenureApiResponse } from '../../../../sdk/occupant-api-sdk';
import { PROPERTY_UNIT_TENURE_TOPIC } from '../../../constants/topics.constant';
import { PropertyUnitTenure } from '../../../data/entities/external/tenure/property-unit-tenure.entity';
import { PropertyUnitTenureService } from '../../services/tenure/property-unit-tenure.service';

@Injectable()
export class PropertyUnitTenureMessageListener implements MessageListener {
    constructor(private entityManager: EntityManager, private propertyUnitTenureService: PropertyUnitTenureService) {}

    @Activity('PROPERTY UNIT TENURE NOTIFICATION')
    async processMessage(message: Buffer): Promise<void> {
        const dto: TenureApiResponse = JSON.parse(message.toString());
        const entity = await this.entityManager.getRepository(PropertyUnitTenure).findOne({ id: dto.id });
        if (!entity) {
            await this.propertyUnitTenureService.create(dto);
        } else {
            await this.propertyUnitTenureService.update(entity, dto);
        }
    }

    getTopic(): string {
        return PROPERTY_UNIT_TENURE_TOPIC;
    }
}
