import { Inject, Injectable } from '@matchmakerjs/di';
import { REDIS } from '@matchmakerjs/matchmaker-redis';
import { RedisClientType } from '@redis/client';
import { BigNumber } from 'bignumber.js';
import dayjs from 'dayjs';
import {
    WorkspaceApiResponse,
    WorkspaceApiResponseTypeEnum,
    WorkspaceContactDetailApiResponseContactTypeEnum,
    WorkspaceControllerApi,
} from '../../sdk/workspace-api-sdk';
import { StringUtils } from '../../utils/string.util';
import { AUTHENTICATION_API_SECRET_KEY_NAME, X_SECRET_KEY } from '../constants/app.constant';
import { TenureLedger } from '../data/entities/external/ledger/tenure/tenure-ledger.entity';
import { Property } from '../data/entities/external/property/property.entity';
import { PropertyUnitOccupant } from '../data/entities/external/tenure/property-unit-occupant.entity';

export type OverdueRentEmailTemplateData = {
    propertyManagerName: string;
    tenantName: string;
    propertyName: string;
    unitNumber: string;
    outstandingAmount: string;
    dueDate: string;
    daysOverdue: number;
    dashboardLink: string;
};

@Injectable()
export class OverdueRentNotificationService {
    constructor(
        private workspaceControllerApi: WorkspaceControllerApi,
        @Inject(REDIS) private redisClient: RedisClientType,
    ) {}

    async prepareMailData(
        occupant: PropertyUnitOccupant,
        ledgersWithOutstanding: TenureLedger[],
    ): Promise<OverdueRentEmailTemplateData> {
        const unit = occupant.tenure.propertyUnit;
        const workspaceData = await this.getWorkspaceData(unit.location);

        if (!workspaceData) {
            return;
        }

        const now = new Date();
        const earliestDefaultedAt = ledgersWithOutstanding
            .map((it) => it.defaultedAt)
            .filter(Boolean)
            .sort((a, b) => a.getTime() - b.getTime())[0];

        const daysOverdue = earliestDefaultedAt
            ? Math.max(0, Math.ceil((now.getTime() - earliestDefaultedAt.getTime()) / 86_400_000))
            : 0;

        const outstandingAmount = ledgersWithOutstanding
            .filter((it) => it.outstanding)
            .map((it) => new BigNumber(it.outstanding))
            .reduce((prev, cur) => prev.plus(cur), new BigNumber(0))
            .toFormat(2, BigNumber.ROUND_CEIL);

        return {
            propertyManagerName: workspaceData.name,
            tenantName: this.getOccupantName(occupant),
            propertyName: this.getPropertyName(unit.location),
            unitNumber: unit.unitNumber || '',
            outstandingAmount,
            dueDate: earliestDefaultedAt ? dayjs(earliestDefaultedAt).format('DD MMM YYYY') : '',
            daysOverdue,
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

    private getPropertyName(property: Property): string {
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
