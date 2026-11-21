import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { PropertyPortfolioApiResponse } from '../../../../sdk/property-api-sdk';
import { PROPERTY_OWNER_TOPIC } from '../../../constants/topics.constant';
import { PropertyOwner } from '../../../data/entities/external/property/property-owner.entity';
import { PropertyOwnerService } from '../../services/property/property-owner.service';

@Injectable()
export class PropertyOwnerMessageListener implements MessageListener {
    constructor(private entityManager: EntityManager, private propertyOwnerService: PropertyOwnerService) {}

    @Activity('PROPERTY OWNER NOTIFICATION')
    async processMessage(message: Buffer): Promise<void> {
        const dto: PropertyPortfolioApiResponse = JSON.parse(message.toString());

        const entity = await this.entityManager.getRepository(PropertyOwner).findOne({ id: dto.id });
        if (!entity) {
            await this.propertyOwnerService.create(dto);
        } else {
            await this.propertyOwnerService.update(entity, dto);
        }
    }

    getTopic(): string {
        return PROPERTY_OWNER_TOPIC;
    }
}
