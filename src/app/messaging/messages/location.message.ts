export enum LocationType {
    CONTINENT = 'CONTINENT',
    SUB_CONTINENT = 'SUB_CONTINENT',
    COUNTRY = 'COUNTRY',
    COUNTRY_ZONE = 'COUNTRY_ZONE',
    STATE_OR_PROVINCE = 'STATE_OR_PROVINCE',
    LGA_OR_COUNTY = 'LGA_OR_COUNTY',
    CITY = 'CITY',
}

export class LocationMessage {
    id: string;
    version: number;
    name: string;
    code: string;
    type: LocationType;
    parents: LocationMessage[];
}
