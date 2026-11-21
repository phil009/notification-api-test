import { Injectable } from '@matchmakerjs/di';
import { PropertyDao } from '../dao/property.dao';
import { PropertyUnit } from '../data/entities/external/property/property-unit.entity';
import { Property } from '../data/entities/external/property/property.entity';

@Injectable()
export class PropertyEnrichmentService {
    constructor(private propertyDao: PropertyDao) {}

    async loadForUnits(units: PropertyUnit[]) {
        return this.loadAncestors(units.filter((it) => it?.location).map((it) => it.location));
    }

    async loadAncestors(properties: Property[]) {
        const ids = properties?.flatMap((it) => it.supersets || []);
        if (!ids?.length) return;
        const map: Record<string, Property> = {};
        (await this.propertyDao.getAllById(ids)).forEach((it) => (map[it.id] = it));
        for (const entry of properties) {
            if (!entry.supersets?.length) continue;
            entry.resolvedSupersets = entry.supersets.map((it) => map[it]);
        }
    }
}
