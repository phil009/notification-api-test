import { ApiResponse, ErrorResponse, Post, RequestBody, RestController, Valid } from '@matchmakerjs/matchmaker';
import { RequestMetadata } from '@matchmakerjs/matchmaker-security';
import { NotificationDao } from '../dao/notification.dao';
import { UserNotificationDao } from '../dao/user-notification.dao';
import { NotificationRecipientApiRequest } from '../data/dto/requests/notification-recipient.request';
import { NotificationRecipientService } from '../services/notification-recipient.service';

@RestController()
export class NotificationViewedController {
    constructor(
        private requestMetadata: RequestMetadata,
        private notificationDao: NotificationDao,
        private userNotificationDao: UserNotificationDao,
        private notificationRecipientService: NotificationRecipientService,
    ) {}

    @Post('/me/viewed-notifications')
    async markNotificationAsRead(
        @Valid() @RequestBody() request: NotificationRecipientApiRequest,
    ): Promise<ApiResponse<number>> {
        const notification = await this.notificationDao.findNotificationById(request.notificationId);

        if (!notification) {
            throw new ErrorResponse(404, {
                message: `Notification does not exist`,
            });
        }

        const recipient = await this.notificationRecipientService.getOrCreateNotificationRecipient(
            notification,
            this.requestMetadata.userId,
        );
        await this.notificationRecipientService.registerViewedNotification(recipient);
        return {
            successful: true,
            data: await this.userNotificationDao.countUnviewedNotifications(this.requestMetadata.userId),
        };
    }
}
