import { Inject, Injectable } from '@matchmakerjs/di';
import { REDIS } from '@matchmakerjs/matchmaker-redis';
import { Transactional } from '@matchmakerjs/typeorm-audit';
import { RedisClientType } from '@redis/client';
import { EntityManager } from 'typeorm';
import { OfflinePaymentApiResponse, OfflinePaymentApiResponseStatusEnum } from '../../../../sdk/ledger-api-sdk';
import {
    WorkspaceApiResponse,
    WorkspaceApiResponseTypeEnum,
    WorkspaceContactDetailApiResponseContactTypeEnum,
    WorkspaceControllerApi,
} from '../../../../sdk/workspace-api-sdk';
import { AUTHENTICATION_API_SECRET_KEY_NAME, X_SECRET_KEY } from '../../../constants/app.constant';
import { NotificationDao } from '../../../dao/notification.dao';
import { WorkspaceDao } from '../../../dao/workspace.dao';
import { OfflinePayment } from '../../../data/entities/external/ledger/offline-payment.entity';
import { PortalUser } from '../../../data/entities/external/portal-user.entity';
import { Workspace } from '../../../data/entities/external/workspace/workspace.entity';
import { Notification } from '../../../data/entities/notification.entity';
import { NotificationType } from '../../../data/enums/notification-type.enum';
import { NotificationTargetService } from '../../../services/notification-target.service';

export type OfflinePaymentTenantEmailData = {
    tenantEmail: string;
    tenantName: string;
    workspaceName: string;
    amount: string;
    currency: string;
    status: 'Accepted' | 'Rejected';
    accepted: boolean;
    reasonForRejection: string;
    dashboardLink: string;
};

export type OfflinePaymentManagerEmailData = {
    managerEmail: string;
    propertyManagerName: string;
    payerName: string;
    amount: string;
    currency: string;
    paymentChannel: string;
    paymentDate: string;
    paymentReference: string;
    dashboardLink: string;
};

export type OfflinePaymentResult = {
    isNewNotification: boolean;
    isNewReportNotification: boolean;
    workspace?: Workspace;
};

@Injectable()
export class OfflinepaymentService {
    constructor(
        private entityManager: EntityManager,
        private notificationDao: NotificationDao,
        private notificationRecipientService: NotificationTargetService,
        private workspaceDao: WorkspaceDao,
        private workspaceControllerApi: WorkspaceControllerApi,
        @Inject(REDIS) private redisClient: RedisClientType,
    ) {}

    @Transactional()
    async create(data: OfflinePaymentApiResponse): Promise<{ payment: OfflinePayment } & OfflinePaymentResult> {
        const entity = new OfflinePayment();
        entity.id = data.id.toString();
        const result = await this.update(entity, data);
        return { payment: entity, ...result };
    }

    @Transactional()
    async update(entity: OfflinePayment, message: OfflinePaymentApiResponse): Promise<OfflinePaymentResult> {
        entity.workspace =
            message.workspaceId &&
            ({
                id: message.workspaceId,
            } as Workspace);
        entity.currency = message.currency;
        entity.amount = message.amount;
        entity.status = message.status;

        entity.paymentDate = message.paymentDate;
        entity.paymentChannel = message.paymentChannel;
        entity.paymentReference = message.paymentReference;
        entity.payerName = message.payerName;

        entity.reviewedAt = message.reviewedAt && new Date(message.reviewedAt);

        // `audit.createdBy` mirrors the sync message and gets reassigned on every update (matching
        // this codebase's usual sync convention). `submittedBy` is captured once, on the first
        // message we ever see for this payment, and frozen after that — it is what identifies the
        // tenant to notify, so it can't drift if a later update's `createdBy` reflects the reviewer
        // rather than the original reporter.
        if (!entity.submittedBy) {
            entity.submittedBy = message.createdBy;
        }

        entity.audit.version = message.version;
        entity.audit.createdBy = message.createdBy;
        entity.audit.createdAt = message.createdAt && new Date(message.createdAt);
        entity.audit.receivedAt = new Date();

        let isNewNotification = false;
        let isNewReportNotification = false;
        let workspace: Workspace | undefined;

        if (
            !entity.notification &&
            entity.reviewedAt &&
            message.workspaceId &&
            [OfflinePaymentApiResponseStatusEnum.Accepted, OfflinePaymentApiResponseStatusEnum.Rejected].includes(
                entity.status,
            )
        ) {
            workspace = await this.workspaceDao.getById(message.workspaceId);
            if (workspace) {
                const result = await this.createNotification(entity, workspace);
                entity.notification = result.notification;
                isNewNotification = result.isNew;
            }
        }

        // A payment the resident has just reported is waiting on the manager. It can't reuse
        // `entity.notification` (that slot belongs to the later review notification for the resident),
        // so it is de-duplicated by (type, sourceReference) instead.
        if (entity.status === OfflinePaymentApiResponseStatusEnum.AwaitingReview && message.workspaceId) {
            workspace = workspace || (await this.workspaceDao.getById(message.workspaceId));
            if (workspace) {
                isNewReportNotification = await this.createReportNotification(entity, workspace);
            }
        }

        await this.entityManager.save(entity);
        return { isNewNotification, isNewReportNotification, workspace };
    }

    async prepareTenantEmailData(
        offlinePayment: OfflinePayment,
        workspace: Workspace,
    ): Promise<OfflinePaymentTenantEmailData | undefined> {
        const submittedBy = offlinePayment.submittedBy;
        if (!submittedBy) return;

        const tenant = await this.entityManager.findOne(PortalUser, { userId: submittedBy });
        if (!tenant?.emailAddress) return;

        const numberFormat = new Intl.NumberFormat('en-us', { minimumFractionDigits: 2 });
        const accepted = offlinePayment.status === OfflinePaymentApiResponseStatusEnum.Accepted;

        return {
            tenantEmail: tenant.emailAddress,
            tenantName: tenant.displayName || `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim(),
            workspaceName: workspace.name,
            amount: numberFormat.format(offlinePayment.amount),
            currency: this.getCurrencySymbol(offlinePayment.currency),
            status: accepted ? 'Accepted' : 'Rejected',
            accepted,
            reasonForRejection: offlinePayment.reasonForRejection || '',
            dashboardLink: process.env.LOGIN_URL || 'https://telah.ng/auth/signin',
        };
    }

    async prepareManagerEmailData(
        offlinePayment: OfflinePayment,
        workspace: Workspace,
    ): Promise<OfflinePaymentManagerEmailData | undefined> {
        const workspaceData = await this.getWorkspaceData(workspace.id);
        if (!workspaceData) return;

        const managerEmail = this.getWorkspaceEmailAddress(workspaceData);
        if (!managerEmail) return;

        const numberFormat = new Intl.NumberFormat('en-us', { minimumFractionDigits: 2 });

        return {
            managerEmail,
            propertyManagerName: workspaceData.name,
            payerName: await this.getPayerName(offlinePayment),
            amount: numberFormat.format(offlinePayment.amount),
            currency: this.getCurrencySymbol(offlinePayment.currency),
            paymentChannel: offlinePayment.paymentChannel || '',
            paymentDate: offlinePayment.paymentDate || '',
            paymentReference: offlinePayment.paymentReference || '',
            dashboardLink: process.env.LOGIN_URL || 'https://telah.ng/auth/signin',
        };
    }

    private async createReportNotification(offlinePayment: OfflinePayment, workspace: Workspace): Promise<boolean> {
        const existing = await this.notificationDao.findNotificationBySource({
            type: NotificationType.OFFLINE_PAYMENT_REPORTED,
            sourceReference: offlinePayment.id,
        });
        if (existing) return false;

        const numberFormat = new Intl.NumberFormat('en-us', { minimumFractionDigits: 2 });
        const formattedAmount = `${this.getCurrencySymbol(offlinePayment.currency)}${numberFormat.format(
            offlinePayment.amount,
        )}`;
        const payerName = await this.getPayerName(offlinePayment);

        const notification = new Notification();
        notification.title = `Payment of ${formattedAmount} reported`;
        notification.message = `${payerName} reported a payment of ${formattedAmount} to ${workspace.name}. It is awaiting your review.`;
        notification.type = NotificationType.OFFLINE_PAYMENT_REPORTED;
        notification.sourceReference = offlinePayment.id;
        await this.entityManager.save(notification);

        await this.notificationRecipientService.createForWorkspace(notification, workspace.id);
        return true;
    }

    private async createNotification(
        offlinePayment: OfflinePayment,
        workspace: Workspace,
    ): Promise<{ notification: Notification; isNew: boolean }> {
        const existing = await this.notificationDao.findNotificationBySource({
            type: NotificationType.OFFLINE_PAYMENT_REVIEWED,
            sourceReference: offlinePayment.id,
        });
        if (existing) {
            offlinePayment.notification = existing;
            return { notification: existing, isNew: false };
        }

        const numberFormat = new Intl.NumberFormat('en-us', {
            minimumFractionDigits: 2,
            currency: offlinePayment.currency,
        });

        let title: string;
        if (offlinePayment.status === OfflinePaymentApiResponseStatusEnum.Accepted) {
            title = `Your reported payment of ${offlinePayment.currency}${numberFormat.format(
                offlinePayment.amount,
            )} to ${workspace.name} has been accepted.`;
        } else if (offlinePayment.status === OfflinePaymentApiResponseStatusEnum.Rejected) {
            title = `Your reported payment of ${offlinePayment.currency}${numberFormat.format(
                offlinePayment.amount,
            )} to ${workspace.name} has been rejected.`;
        }

        const entity = new Notification();
        entity.title = title;
        entity.type = NotificationType.OFFLINE_PAYMENT_REVIEWED;
        entity.sourceReference = offlinePayment.id;
        await this.entityManager.save(entity);

        await this.notificationRecipientService.createForUser(entity, offlinePayment.submittedBy);
        return { notification: entity, isNew: true };
    }

    private async getPayerName(offlinePayment: OfflinePayment): Promise<string> {
        if (offlinePayment.payerName) return offlinePayment.payerName;
        const submittedBy = offlinePayment.submittedBy;
        if (submittedBy) {
            const user = await this.entityManager.findOne(PortalUser, { userId: submittedBy });
            const name = user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
            if (name) return name;
        }
        return 'A tenant';
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
                email = workspaceData.landlord?.emailAddress;
            }
        }
        return email;
    }

    private async getWorkspaceData(workspaceId: string): Promise<WorkspaceApiResponse | undefined> {
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

    private getCurrencySymbol(currencyCode: string): string {
        const symbols: Record<string, string> = { NGN: '₦' };
        return symbols[currencyCode] ?? currencyCode;
    }
}
