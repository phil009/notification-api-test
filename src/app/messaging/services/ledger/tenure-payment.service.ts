import { Inject, Injectable } from '@matchmakerjs/di';
import { REDIS } from '@matchmakerjs/matchmaker-redis';
import { RedisClientType } from '@redis/client';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { TenurePaymentApiResponse } from '../../../../sdk/ledger-api-sdk';
import {
    WorkspaceApiResponse,
    WorkspaceApiResponseTypeEnum,
    WorkspaceContactDetailApiResponseContactTypeEnum,
    WorkspaceControllerApi,
} from '../../../../sdk/workspace-api-sdk';
import { AUTHENTICATION_API_SECRET_KEY_NAME, X_SECRET_KEY } from '../../../constants/app.constant';
import { NotificationDao } from '../../../dao/notification.dao';
import { Property } from '../../../data/entities/external/property/property.entity';
import { OfflinePayment } from '../../../data/entities/external/ledger/offline-payment.entity';
import { TenureLedger } from '../../../data/entities/external/ledger/tenure/tenure-ledger.entity';
import { TenurePayment } from '../../../data/entities/external/ledger/tenure/tenure-payment.entity';
import { Notification } from '../../../data/entities/notification.entity';
import { NotificationType } from '../../../data/enums/notification-type.enum';
import { NotificationTargetService } from '../../../services/notification-target.service';

export type TenurePaymentManagerEmailData = {
    managerEmail: string;
    propertyManagerName: string;
    payerName: string;
    propertyName: string;
    unitNumber: string;
    amount: string;
    currency: string;
    dashboardLink: string;
};

@Injectable()
export class PropertyUnitTenurePaymentService {
    constructor(
        private entityManager: EntityManager,
        private notificationDao: NotificationDao,
        private notificationTargetService: NotificationTargetService,
        private workspaceControllerApi: WorkspaceControllerApi,
        @Inject(REDIS) private redisClient: RedisClientType,
    ) {}

    @Transactional()
    async create(
        data: TenurePaymentApiResponse,
    ): Promise<{ payment: TenurePayment; isNewManagerNotification: boolean; tenureLedger?: TenureLedger }> {
        const entity = new TenurePayment();
        entity.id = data.id;
        const result = await this.update(entity, data);
        return { payment: entity, ...result };
    }

    @Transactional()
    async update(
        entity: TenurePayment,
        data: TenurePaymentApiResponse,
    ): Promise<{ isNewManagerNotification: boolean; tenureLedger?: TenureLedger }> {
        entity.currency = data.tenureLedger?.currency;
        entity.amount = data.amount;

        entity.tenureLedger =
            data.tenureLedger?.id &&
            ({
                id: data.tenureLedger.id,
            } as TenureLedger);

        // entity.walletTransaction =
        //     data?.walletTransaction?.id &&
        //     ({
        //         id: data.walletTransaction.id,
        //     } as WalletTransaction);

        // entity.splitPayment =
        //     data?.splitPayment?.id &&
        //     ({
        //         id: data.splitPayment.id,
        //     } as SplitPayment);

        entity.offlinePayment =
            data?.offlinePayment?.id &&
            ({
                id: data.offlinePayment.id,
            } as OfflinePayment);

        entity.audit.version = data.version;
        entity.audit.createdAt = data.createdAt && new Date(data.createdAt);
        entity.audit.deactivatedAt = data.deactivatedAt && new Date(data.deactivatedAt);

        let isNewManagerNotification = false;
        let tenureLedger: TenureLedger | undefined;

        // Only a payment made through the resident's wallet (not one a manager logs offline) should
        // alert the manager/agency, and only once per payment.
        if (!entity.notification && !data.offlinePayment) {
            const result = await this.createManagerNotification(entity, data);
            entity.notification = result.notification;
            isNewManagerNotification = result.isNew;
            tenureLedger = result.tenureLedger;
        }

        await this.entityManager.save(entity);
        return { isNewManagerNotification, tenureLedger };
    }

    async prepareManagerEmailData(
        payment: TenurePayment,
        data: TenurePaymentApiResponse,
        tenureLedger: TenureLedger | undefined,
    ): Promise<TenurePaymentManagerEmailData | undefined> {
        const unit = tenureLedger?.tenure?.propertyUnit;
        if (!unit?.location) return;

        const workspaceData = await this.getWorkspaceData(unit.location);
        if (!workspaceData) return;

        const managerEmail = this.getWorkspaceEmailAddress(workspaceData);
        if (!managerEmail) return;

        const numberFormat = new Intl.NumberFormat('en-us', { minimumFractionDigits: 2 });

        return {
            managerEmail,
            propertyManagerName: workspaceData.name,
            payerName: this.getOccupantName(data.occupant) || 'A tenant',
            propertyName: this.getPropertyName(unit.location),
            unitNumber: unit.unitNumber || '',
            amount: numberFormat.format(payment.amount),
            currency: this.getCurrencySymbol(payment.currency),
            dashboardLink: process.env.LOGIN_URL || 'https://telah.ng/auth/signin',
        };
    }

    private async createManagerNotification(
        payment: TenurePayment,
        data: TenurePaymentApiResponse,
    ): Promise<{ notification: Notification | undefined; isNew: boolean; tenureLedger?: TenureLedger }> {
        const existing = await this.notificationDao.findNotificationBySource({
            type: NotificationType.TENURE_PAYMENT_RECORDED,
            sourceReference: payment.id,
        });

        const tenureLedger = await this.resolveTenureLedger(data.tenureLedger?.id);
        if (existing) return { notification: existing, isNew: false, tenureLedger };

        const workspaceId = this.getWorkspaceId(tenureLedger);
        if (!workspaceId) return { notification: undefined, isNew: false, tenureLedger };

        const numberFormat = new Intl.NumberFormat('en-us', { minimumFractionDigits: 2 });
        const payerName = this.getOccupantName(data.occupant);

        const notification = new Notification();
        notification.title = `Payment of ${payment.currency}${numberFormat.format(payment.amount)} received`;
        notification.message = payerName
            ? `${payerName} recorded a rent payment of ${payment.currency}${numberFormat.format(payment.amount)}`
            : notification.title;
        notification.type = NotificationType.TENURE_PAYMENT_RECORDED;
        notification.sourceReference = payment.id;
        await this.entityManager.save(notification);

        await this.notificationTargetService.createForWorkspace(notification, workspaceId);
        return { notification, isNew: true, tenureLedger };
    }

    private getWorkspaceEmailAddress(workspaceData: WorkspaceApiResponse): string {
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

    private async getWorkspaceData(property: Property): Promise<WorkspaceApiResponse | undefined> {
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

    private getPropertyName(property: Property): string {
        if (property.resolvedSupersets?.length) {
            property = property.resolvedSupersets.at(-1);
        }
        return property.name || '';
    }

    private getCurrencySymbol(currencyCode: string): string {
        const symbols: Record<string, string> = { NGN: '₦' };
        return symbols[currencyCode] ?? currencyCode;
    }

    private getWorkspaceId(tenureLedger: TenureLedger | undefined): string | undefined {
        const property = tenureLedger?.tenure?.propertyUnit?.location;
        return property?.workspace?.id || property?.owner?.workspace?.id;
    }

    private async resolveTenureLedger(tenureLedgerId: string): Promise<TenureLedger | undefined> {
        if (!tenureLedgerId) return undefined;
        return this.entityManager
            .createQueryBuilder(TenureLedger, 'l')
            .innerJoinAndSelect('l.tenure', 't')
            .innerJoinAndSelect('t.propertyUnit', 'u')
            .leftJoinAndSelect('u.location', 'p')
            .leftJoinAndSelect('p.workspace', 'pw')
            .leftJoinAndSelect('p.owner', 'o')
            .leftJoinAndSelect('o.workspace', 'ow')
            .where('l.id = :id', { id: tenureLedgerId })
            .getOne();
    }

    private getOccupantName(occupant: TenurePaymentApiResponse['occupant']): string {
        if (!occupant) return '';
        let title = occupant.title || '';
        if (title.length && !title.endsWith('.')) {
            title += '.';
        }
        return `${title} ${occupant.firstName || ''} ${occupant.lastName || ''}`.replace(/\s+/g, ' ').trim();
    }
}
