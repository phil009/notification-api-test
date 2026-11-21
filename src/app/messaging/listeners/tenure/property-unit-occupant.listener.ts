import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { OccupantApiResponse } from '../../../../sdk/occupant-api-sdk';
import { PROPERTY_UNIT_OCCUPANT_TOPIC } from '../../../constants/topics.constant';
import { PropertyUnitOccupant } from '../../../data/entities/external/tenure/property-unit-occupant.entity';
import { PropertyUnitOccupantService } from '../../services/tenure/property-unit-occupant.service';

@Injectable()
export class PropertyUnitOccupantMessageListener implements MessageListener {
    constructor(
        private entityManager: EntityManager,
        private propertyUnitOccupantService: PropertyUnitOccupantService,
    ) {}

    @Activity('PROPERTY UNIT OCCUPANT NOTIFICATION')
    async processMessage(message: Buffer): Promise<void> {
        const dto: OccupantApiResponse = JSON.parse(message.toString());

        const entity = await this.entityManager.getRepository(PropertyUnitOccupant).findOne({ id: dto.id });
        if (!entity) {
            await this.propertyUnitOccupantService.create(dto);
        } else {
            await this.propertyUnitOccupantService.update(entity, dto);
        }
    }

    getTopic(): string {
        return PROPERTY_UNIT_OCCUPANT_TOPIC;
    }
}
