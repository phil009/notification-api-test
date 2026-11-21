import { ApiResponse, Get, PathParameter, Query, QueryParameter, RestController } from '@matchmakerjs/matchmaker';
import { RequestMetadata } from '@matchmakerjs/matchmaker-security';
import { WorkspaceNotificationDao } from '../dao/workspace-notification.dao';
import { ViewStatus } from '../dao/notification.dao';
import { PageRequest } from '../data/dto/requests/page-request';
import { NotificationApiResponse } from '../data/dto/responses/notification.response';
import { SearchResult } from '../data/dto/responses/search-result';

@RestController()
export class WorkspaceNotificationController {
    constructor(
        private requestMetadata: RequestMetadata,
        private workspaceNotificationDao: WorkspaceNotificationDao,
    ) {}

    @Get('/workspaces/:workspaceId/notifications')
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

    @Get('/workspaces/:workspaceId/unviewed-notifications/count')
    async getCurrentWorkspaceUnviewedNotificationCount(
        @PathParameter('workspaceId') workspaceId: string,
    ): Promise<ApiResponse<number>> {
        return {
            successful: true,
            data: await this.workspaceNotificationDao.countUnviewedNotifications(this.requestMetadata.userId, workspaceId),
        };
    }

    private async fetchNotifications({
        userId,
        workspaceId,
        viewStatus,
        page,
    }: {
        userId: string;
        workspaceId: string;
        viewStatus: ViewStatus;
        page: PageRequest;
    }): Promise<SearchResult<NotificationApiResponse>> {
        const limit = PageRequest.getLimit(page.limit, 10, 100);
        const offset = PageRequest.getOffset(page.offset);

        const qb = this.workspaceNotificationDao.createQuery({
            viewStatus,
            userId,
            workspaceId,
            loadAddress: true,
        });

        const entities = await this.workspaceNotificationDao.fetchResults(qb.clone().distinct(), {
            limit,
            offset,
        });
        const results = entities.map((it) => NotificationApiResponse.fromEntity(it));
        let total = PageRequest.computeTotal(limit, offset, results.length);
        if (typeof total !== 'number') {
            ({ total } = await qb.clone().select('count(DISTINCT e.id)', 'total').getRawOne());
            total = Number(total);
        }
        return { limit, offset, total, results };
    }
}
