import {
    ApiResponse, Get,
    PathParameter, Query,
    QueryParameter, RestController
} from '@matchmakerjs/matchmaker';
import { RequestMetadata } from '@matchmakerjs/matchmaker-security';
import { NotificationDao, ViewStatus } from '../dao/notification.dao';
import { PageRequest } from '../data/dto/requests/page-request';
import { NotificationApiResponse } from '../data/dto/responses/notification.response';
import { SearchResult } from '../data/dto/responses/search-result';
import { NotificationApiWorkspaceApiResponse } from '../data/dto/responses/workspace.response';
import { NotificationType } from '../data/enums/notification-type.enum';
import { NotificationRecipientService } from '../services/notification-recipient.service';

@RestController()
export class NotificationController {
    constructor(
        private requestMetadata: RequestMetadata,
        private notificationDao: NotificationDao,
        private notificationRecipientService: NotificationRecipientService,
    ) {}

    @Get('/me/workspaces/:workspaceId/notifications')
    async getCurrentWorkspaceNotifications(
        @PathParameter('workspaceId') workspaceId: string,
        @Query() page: PageRequest,
        @QueryParameter('viewStatus') viewStatus: ViewStatus,
    ): Promise<SearchResult<NotificationApiResponse>> {
        return this.fetchNotifications({
            viewStatus,
            userId: this.requestMetadata.userId,
            workspaceId,
            page,
        });
    }

    @Get('/me/workspaces/:workspaceId/unviewed-notifications/count')
    async getCurrentWorkspaceUnviewedNotificationCount(
        @PathParameter('workspaceId') workspaceId: string,
    ): Promise<ApiResponse<number>> {
        return {
            successful: true,
            data: await this.notificationDao.countUnviewedNotifications(this.requestMetadata.userId, workspaceId),
        };
    }

    private async fetchNotifications({
        userId,
        workspaceId,
        viewStatus,
        page,
    }: {
        userId: string;
        workspaceId?: string;
        viewStatus: ViewStatus;
        page: PageRequest;
    }): Promise<SearchResult<NotificationApiResponse>> {
        const limit = PageRequest.getLimit(page.limit, 10, 100);
        const offset = PageRequest.getOffset(page.offset);

        const qb = this.notificationDao.createQuery({
            viewStatus,
            userId,
            workspaceId,
            loadAddress: true,
        });

        const entities = await this.notificationDao.fetchResults(qb.clone().distinct(), {
            limit,
            offset,
        });
        const results = entities.map((it) => {
            const response = NotificationApiResponse.fromEntity(it);
            const workspace = it.offlinePayment?.workspace;
            if (workspace && it.type === NotificationType.OFFLINE_PAYMENT_REVIEWED) {
                const workspaceResponse = NotificationApiWorkspaceApiResponse.fromEntity(workspace);
                if (workspace.hasLogo) {
                    workspaceResponse.logoUrl = `${
                        process.env.OCCUPANT_API_CONTEXT_PATH || '/occupant-api'
                    }/me/tenure-workspaces/${workspace.id}/logo`;
                }
                response.offlinePayment.workspace = workspaceResponse;
            }
            return response;
        });
        let total = PageRequest.computeTotal(limit, offset, results.length);
        if (typeof total !== 'number') {
            ({ total } = await qb.clone().select('count(DISTINCT e.id)', 'total').getRawOne());
            total = Number(total);
        }
        return { limit, offset, total, results };
    }
}
