import { Inject, Injectable } from '@matchmakerjs/di';
import { REDIS } from '@matchmakerjs/matchmaker-redis';
import { RedisClientType } from '@redis/client';
import dayjs from 'dayjs';
import {
    WorkspaceApiResponse,
    WorkspaceApiResponseTypeEnum,
    WorkspaceContactDetailApiResponseContactTypeEnum,
    WorkspaceControllerApi,
} from '../../sdk/workspace-api-sdk';
import { StringUtils } from '../../utils/string.util';
import { AUTHENTICATION_API_SECRET_KEY_NAME, X_SECRET_KEY } from '../constants/app.constant';
import { PropertyUnit } from '../data/entities/external/property/property-unit.entity';
import { Property } from '../data/entities/external/property/property.entity';
import { PropertyUnitOccupant } from '../data/entities/external/tenure/property-unit-occupant.entity';
import { PropertyUnitTenure } from '../data/entities/external/tenure/property-unit-tenure.entity';

export type RentExpiryEmailTemplateData = {
    propertyManagerName: string;
    propertyName: string;
    unitNumber: string;
    tenantName: string;
    expiryDate: string;
    daysLeft: number;
    dashboardLink: string;
};

@Injectable()
export class RentExpiryNotificationService {
    constructor(
        private workspaceControllerApi: WorkspaceControllerApi,
        @Inject(REDIS) private redisClient: RedisClientType,
    ) {}

    async prepareMailData(
        tenure: PropertyUnitTenure,
        primaryOccupant: PropertyUnitOccupant | undefined,
    ): Promise<RentExpiryEmailTemplateData> {
        const unit = tenure.propertyUnit;
        const workspaceData = await this.getWorkspaceData(unit.location);

        if (!workspaceData) {
            return;
        }

        const now = new Date();
        const daysLeft = Math.max(0, Math.ceil((tenure.endedAt.getTime() - now.getTime()) / 86_400_000));

        return {
            propertyManagerName: workspaceData.name,
            propertyName: this.getPropertyName(unit),
            unitNumber: unit.unitNumber || '',
            tenantName: primaryOccupant ? this.getOccupantName(primaryOccupant) : '',
            expiryDate: dayjs(tenure.endedAt).format('DD MMM YYYY'),
            daysLeft,
            dashboardLink: process.env.LOGIN_URL || 'https://telah.ng/auth/signin',
        };
    }

    getWorkspaceEmailAddress(workspaceData: WorkspaceApiResponse): string {
        let email = workspaceData.contactDetails?.find(
            (it) => it.contactType === WorkspaceContactDetailApiResponseContactTypeEnum.EmailAddress,
        )?.contact;

        if (!email) {
            if (workspaceData.type === WorkspaceApiResponseTypeEnum.Realtor) {
                email = workspaceData.realEstateCompany?.emailAddress;
            }
            if (workspaceData.type === WorkspaceApiResponseTypeEnum.Landlord) {
                email = workspaceData.landlord.emailAddress;
            }
        }
        return email;
    }

    private getPropertyName(unit: PropertyUnit): string {
        let property = unit.location;
        if (property.resolvedSupersets?.length) {
            property = property.resolvedSupersets.at(-1);
        }
        return property.name || '';
    }

    private getOccupantName(occupant: PropertyUnitOccupant): string {
        let title = occupant.title || '';
        if (title.length && !title.endsWith('.')) {
            title += '.';
        }
        return StringUtils.normalizeSpace(`${title} ${occupant.firstName} ${occupant.lastName}`);
    }

    async getWorkspaceData(property: Property): Promise<WorkspaceApiResponse | undefined> {
        if (property.resolvedSupersets?.length) {
            property = property.resolvedSupersets.at(-1);
        }
        const workspace = property.owner?.workspace || property.workspace;
        if (!workspace) {
            return;
        }
        const workspaceId = workspace.id;
        const response = await this.workspaceControllerApi.getWorkspaceForSystem(
            { workspaceId: [workspaceId] },
            {
                headers: {
                    [X_SECRET_KEY]: await this.redisClient.get(AUTHENTICATION_API_SECRET_KEY_NAME),
                },
            },
        );
        const workspaceData = response.data.results.find((it) => it.id === workspaceId);
        if (!workspaceData) {
            return Promise.reject(`Workspace data for ${workspaceId} could not be retrieved`);
        }
        return workspaceData;
    }
}
