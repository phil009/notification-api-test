import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { AddressApiResponse, PropertyUnitApiResponse } from '../../../../sdk/property-api-sdk';
import { Address } from '../../../data/entities/address.entity';
import { Lga } from '../../../data/entities/external/location/lga.entity';
import { PropertyUnit } from '../../../data/entities/external/property/property-unit.entity';
import { Property } from '../../../data/entities/external/property/property.entity';

@Injectable()
export class PropertyUnitService {
    constructor(private entityManager: EntityManager) { }

    @Transactional()
    async createPropertyUnit(data: PropertyUnitApiResponse): Promise<PropertyUnit> {
        const entity = new PropertyUnit();
        entity.id = data.id;
        await this.updatePropertyUnit(entity, data);
        return entity;
    }

    @Transactional()
    async updatePropertyUnit(entity: PropertyUnit, data: PropertyUnitApiResponse): Promise<PropertyUnit> {
        entity.location = null;
        // entity.workspaceId = null;

        // entity.tenuresBillable = true;
        if (data.location) {
            entity.location = {
                id: data.location.id,
            } as Property;
            //     if (data.location.deactivatedAt) {
            //         entity.tenuresBillable = false;
            //     } else if (!data.location.owner && !data.location.supersets?.find(it => it.owner)) {
            //         entity.tenuresBillable = false;
            //     }
            // } else {
            //     entity.workspaceId = data.workspaceId;
            //     entity.tenuresBillable = false;
        }

        entity.unitNumber = data.unitNumber;
        entity.referenceCode = data.referenceCode;
        entity.audit.version = data.version;

        // if (!data.property && data.address) {
        //     if (!entity.address) {
        //         entity.address = new Address();
        //     }
        //     await this.updateAddress(entity.address, data.address);
        // } else if (entity.address) {
        //     await this.entityManager.remove(entity.address);
        //     entity.address = null;
        // }

        return this.entityManager.save(entity);
    }

    private async updateAddress(address: Address, data: AddressApiResponse) {
        const lga = new Lga();
        lga.id = data.lga.id;
        address.lga = lga;
        address.city = data.city;
        // address.postalCode = data.postalCode?.trim();
        address.streetAddress = data.streetAddress;
        await this.entityManager.save(address);
    }
}
