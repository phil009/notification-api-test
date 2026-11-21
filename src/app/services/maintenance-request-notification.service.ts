import { Inject, Injectable } from "@matchmakerjs/di";
import { REDIS } from "@matchmakerjs/matchmaker-redis";
import { RedisClientType } from "@redis/client";
import { Transactional } from "@matchmakerjs/typeorm-audit";
import { EntityManager } from "typeorm";
import {
    WorkspaceApiResponse,
    WorkspaceApiResponseTypeEnum,
    WorkspaceContactDetailApiResponseContactTypeEnum,
    WorkspaceControllerApi,
} from "../../sdk/workspace-api-sdk";
import { StringUtils } from "../../utils/string.util";
import { AUTHENTICATION_API_SECRET_KEY_NAME, X_SECRET_KEY } from "../constants/app.constant";
import { MaintenanceRequest } from "../dao/maintenance-request.dao";
import { NotificationDao } from "../dao/notification.dao";
import { PortalUser } from "../data/entities/external/portal-user.entity";
import { Property } from "../data/entities/external/property/property.entity";
import { PropertyUnit } from "../data/entities/external/property/property-unit.entity";
import { Notification } from "../data/entities/notification.entity";
import { NotificationType } from "../data/enums/notification-type.enum";
import { NotificationTargetService } from "./notification-target.service";

export type MaintenanceRequestManagerEmailData = {
    managerEmail: string;
    propertyManagerName: string;
    tenantName: string;
    propertyName: string;
    unitNumber: string;
    requestType: string;
    description: string;
    priority: string;
    status: string;
    dashboardLink: string;
};

export type MaintenanceRequestTenantEmailData = {
    tenantEmail: string;
    tenantName: string;
    propertyName: string;
    unitNumber: string;
    requestType: string;
    statusLabel: string;
    completed: boolean;
};

@Injectable()
export class MaintenanceRequestNotificationService {
    constructor(
        private entityManager: EntityManager,
        private notificationDao: NotificationDao,
        private notificationTargetService: NotificationTargetService,
        private workspaceControllerApi: WorkspaceControllerApi,
        @Inject(REDIS) private redisClient: RedisClientType,
    ) {}

    @Transactional()
    async notifyManagersOfNewRequest(
        request: MaintenanceRequest,
    ): Promise<{ created: boolean; unit?: PropertyUnit }> {
        const existing = await this.notificationDao.findNotificationBySource({
            type: NotificationType.MAINTENANCE_REQUEST_CREATED,
            sourceReference: request.id,
        });

        const unit = await this.resolveUnit(request.unitId);
        if (existing) return { created: false, unit };

        const workspaceId = request.workspaceId || this.getWorkspaceId(unit);
        if (!workspaceId) return { created: false, unit };

        const notification = new Notification();
        notification.title = "New maintenance request";
        notification.message = `A new ${request.requestType} maintenance request was submitted: ${request.description}`;
        notification.type = NotificationType.MAINTENANCE_REQUEST_CREATED;
        notification.sourceReference = request.id;
        await this.entityManager.save(notification);

        await this.notificationTargetService.createForWorkspace(
            notification,
            workspaceId,
        );

        return { created: true, unit };
    }

    @Transactional()
    async notifyResidentOfStatusChange(
        request: MaintenanceRequest,
    ): Promise<{ created: boolean; unit?: PropertyUnit }> {
        if (!request.requesterId) return { created: false };

        // Each status reached is a distinct event, so the source reference includes the
        // status — otherwise the unique (type, sourceReference) constraint on Notification
        // would let only the first status change for a request ever notify.
        const sourceReference = `${request.id}:${request.status}`;

        const existing = await this.notificationDao.findNotificationBySource({
            type: NotificationType.MAINTENANCE_REQUEST_STATUS_CHANGED,
            sourceReference,
        });

        const unit = await this.resolveUnit(request.unitId);
        if (existing) return { created: false, unit };

        const { title, message } = this.getStatusChangeCopy(request);

        const notification = new Notification();
        notification.title = title;
        notification.message = message;
        notification.type = NotificationType.MAINTENANCE_REQUEST_STATUS_CHANGED;
        notification.sourceReference = sourceReference;
        await this.entityManager.save(notification);

        await this.notificationTargetService.createForUser(
            notification,
            request.requesterId,
        );

        return { created: true, unit };
    }

    async prepareManagerEmailData(
        request: MaintenanceRequest,
        unit: PropertyUnit | undefined,
    ): Promise<MaintenanceRequestManagerEmailData | undefined> {
        if (!unit?.location) return;

        const workspaceData = await this.getWorkspaceData(unit.location);
        if (!workspaceData) return;

        const managerEmail = this.getWorkspaceEmailAddress(workspaceData);
        if (!managerEmail) return;

        const requester = request.requesterId
            ? await this.entityManager.findOne(PortalUser, { userId: request.requesterId })
            : undefined;

        return {
            managerEmail,
            propertyManagerName: workspaceData.name,
            tenantName: requester ? this.getUserName(requester) : "A tenant",
            propertyName: this.getPropertyName(unit.location),
            unitNumber: unit.unitNumber || "",
            requestType: request.requestType,
            description: request.description,
            priority: request.priority,
            status: request.status,
            dashboardLink: process.env.LOGIN_URL || "https://telah.ng/auth/signin",
        };
    }

    async prepareTenantEmailData(
        request: MaintenanceRequest,
        unit: PropertyUnit | undefined,
    ): Promise<MaintenanceRequestTenantEmailData | undefined> {
        if (!request.requesterId) return;

        const requester = await this.entityManager.findOne(PortalUser, { userId: request.requesterId });
        if (!requester?.emailAddress) return;

        return {
            tenantEmail: requester.emailAddress,
            tenantName: this.getUserName(requester),
            propertyName: unit?.location ? this.getPropertyName(unit.location) : "",
            unitNumber: unit?.unitNumber || "",
            requestType: request.requestType,
            statusLabel: this.getStatusLabel(request.status),
            completed: request.status === "COMPLETED",
        };
    }

    private getStatusLabel(status: string): string {
        switch (status) {
            case "IN_PROGRESS":
                return "In Progress";
            case "COMPLETED":
                return "Completed";
            default:
                return status;
        }
    }

    private getStatusChangeCopy(request: MaintenanceRequest): { title: string; message: string } {
        switch (request.status) {
            case "IN_PROGRESS":
                return {
                    title: "Maintenance request in progress",
                    message: `Your ${request.requestType} maintenance request is now in progress`,
                };
            case "COMPLETED":
                return {
                    title: "Maintenance request completed",
                    message: `Your ${request.requestType} maintenance request has been marked as completed`,
                };
            default:
                return {
                    title: "Maintenance request updated",
                    message: `Your ${request.requestType} maintenance request status changed to ${request.status}`,
                };
        }
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
        return property.name || "";
    }

    private getUserName(user: PortalUser): string {
        return user.displayName || StringUtils.normalizeSpace(`${user.firstName || ""} ${user.lastName || ""}`);
    }

    private getWorkspaceId(unit: PropertyUnit | undefined): string | undefined {
        const property = unit?.location;
        return property?.workspace?.id || property?.owner?.workspace?.id;
    }

    private async resolveUnit(unitId: string): Promise<PropertyUnit | undefined> {
        if (!unitId) return undefined;
        return this.entityManager
            .createQueryBuilder(PropertyUnit, "u")
            .leftJoinAndSelect("u.location", "p")
            .leftJoinAndSelect("p.workspace", "pw")
            .leftJoinAndSelect("p.owner", "o")
            .leftJoinAndSelect("o.workspace", "ow")
            .where("u.id = :id", { id: unitId })
            .getOne();
    }
}
