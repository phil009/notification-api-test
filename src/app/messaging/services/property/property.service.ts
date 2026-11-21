import { Injectable } from '@matchmakerjs/di';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { AddressApiResponse, PropertyApiResponse } from '../../../../sdk/property-api-sdk';
import { Address } from '../../../data/entities/address.entity';
import { Lga } from '../../../data/entities/external/location/lga.entity';
import { NamedRecord } from '../../../data/entities/external/named-record/named-record.entity';
import { PropertyOwner } from '../../../data/entities/external/property/property-owner.entity';
import { Property } from '../../../data/entities/external/property/property.entity';
import { Workspace } from '../../../data/entities/external/workspace/workspace.entity';

@Injectable()
export class PropertyService {
    constructor(private entityManager: EntityManager) {}

    @Transactional()
    async createProperty(data: PropertyApiResponse): Promise<Property> {
        const entity = new Property();
        entity.id = data.id;
        await this.updateProperty(entity, data);
        return entity;
    }

    @Transactional()
    async updateProperty(entity: Property, data: PropertyApiResponse): Promise<Property> {
        entity.workspace = null;

        entity.owner = null;
        if (data.portfolio) {
            const owner = new PropertyOwner();
            owner.id = data.portfolio.id;
            entity.owner = owner;
        } else {
            entity.workspace = {
                id: data.workspaceId,
            } as Workspace;
        }

        entity.supersets = data.supersets?.length ? data.supersets?.map((it) => it.id) : null;
        entity.name = data.name;

        entity.audit.version = data.version;
        entity.audit.deactivatedAt = data.deactivatedAt && new Date(data.deactivatedAt);

        entity.category = null;
        if (data.categories?.length) {
            const category = new NamedRecord();
            category.id = data.categories[0].id;
            entity.category = category;
        }
        if (data.address) {
            if (!entity.address) {
                entity.address = new Address();
            }
            await this.updateAddress(entity.address, data.address);
        } else if (entity.address) {
            await this.entityManager.remove(entity.address);
            entity.address = null;
        }
        return this.entityManager.save(entity);
    }

    private async updateAddress(address: Address, data: AddressApiResponse) {
        const lga = new Lga();
        lga.id = data.lga.id;
        address.lga = lga;
        address.city = data.city;
        address.postalCode = data.postalCode;
        address.streetAddress = data.streetAddress;
        address.landmark = data.landmark;
        await this.entityManager.save(address);
    }
}
