import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { LOCATION_TOPIC } from '../../../constants/topics.constant';
import { Country } from '../../../data/entities/external/location/country.entity';
import { Lga } from '../../../data/entities/external/location/lga.entity';
import { State } from '../../../data/entities/external/location/state.entity';
import { LocationMessage, LocationType } from '../../messages/location.message';
import { CountryService } from '../../services/location/country.service';
import { LgaService } from '../../services/location/lga.service';
import { StateService } from '../../services/location/state.service';

@Injectable()
export class LocationMessageListener implements MessageListener {
    constructor(
        private entityManager: EntityManager,
        private lgaService: LgaService,
        private stateService: StateService,
        private countryService: CountryService,
    ) {}

    @Activity('LOCATION NOTIFICATION')
    async processMessage(message: Buffer): Promise<void> {
        const dto: LocationMessage = JSON.parse(message.toString());

        if (dto.type === LocationType.STATE_OR_PROVINCE) {
            const entity = await this.entityManager.getRepository(State).findOne({ id: dto.id });
            if (!entity) {
                await this.stateService.createState(dto);
            } else if (entity.audit.version <= dto.version) {
                await this.stateService.updateState(entity, dto);
            }
        } else if (dto.type === LocationType.LGA_OR_COUNTY) {
            const entity = await this.entityManager.getRepository(Lga).findOne({ id: dto.id });
            if (!entity) {
                await this.lgaService.createLga(dto);
            } else if (entity.audit.version <= dto.version) {
                await this.lgaService.updateLga(entity, dto);
            }
        } else if (dto.type === LocationType.COUNTRY) {
            const entity = await this.entityManager.getRepository(Country).findOne({ id: dto.id });
            if (!entity) {
                await this.countryService.createCountry(dto);
            } else if (entity.audit.version <= dto.version) {
                await this.countryService.updateCountry(entity, dto);
            }
        }
    }

    getTopic(): string {
        return LOCATION_TOPIC;
    }
}
