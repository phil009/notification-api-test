import { ApiResponse, Get, Query, QueryParameter, RestController } from '@matchmakerjs/matchmaker';
import { RequestMetadata } from '@matchmakerjs/matchmaker-security';
import { UserNotificationDao } from '../dao/user-notification.dao';
import { ViewStatus } from '../dao/notification.dao';
import { PageRequest } from '../data/dto/requests/page-request';
import { NotificationApiResponse } from '../data/dto/responses/notification.response';
import { SearchResult } from '../data/dto/responses/search-result';
import { NotificationApiWorkspaceApiResponse } from '../data/dto/responses/workspace.response';
import { NotificationType } from '../data/enums/notification-type.enum';

@RestController()
export class UserNotificationController {
    constructor(
        private requestMetadata: RequestMetadata,
        private userNotificationDao: UserNotificationDao,
    ) {}

    @Get('/me/notifications')
    async getCurrentUserNotifications(
        @Query() page: PageRequest,
        @QueryParameter('viewStatus') viewStatus: ViewStatus,
    ): Promise<SearchResult<NotificationApiResponse>> {
        return this.fetchNotifications({
            viewStatus,
            userId: this.requestMetadata.userId,
            page,
        });
    }

    @Get('/me/unviewed-notifications/count')
    async getCurrentUserUnviewedNotificationCount(): Promise<ApiResponse<number>> {
        return {
            successful: true,
            data: await this.userNotificationDao.countUnviewedNotifications(this.requestMetadata.userId),
        };
    }

    private async fetchNotifications({
        userId,
        viewStatus,
        page,
    }: {
        userId: string;
        viewStatus: ViewStatus;
        page: PageRequest;
    }): Promise<SearchResult<NotificationApiResponse>> {
        const limit = PageRequest.getLimit(page.limit, 10, 100);
        const offset = PageRequest.getOffset(page.offset);

        const qb = this.userNotificationDao.createQuery({
            viewStatus,
            userId,
            loadAddress: true,
        });

        const entities = await this.userNotificationDao.fetchResults(qb.clone().distinct(), {
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
