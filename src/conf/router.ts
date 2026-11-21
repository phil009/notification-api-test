import { SimpleRouter } from '@matchmakerjs/matchmaker';
import { IndexController } from '../app/controllers/index.controller';
import { NotificationViewedController } from '../app/controllers/notification-viewed.controller';
import { UserNotificationController } from '../app/controllers/user-notification.controller';
import { WalletTransactionController } from '../app/controllers/wallet-transaction.controller';
import { WorkspaceNotificationController } from '../app/controllers/workspace-notification.controller';

export default SimpleRouter.fromControllers([
    IndexController,
    UserNotificationController,
    WorkspaceNotificationController,
    NotificationViewedController,
    WalletTransactionController,
]);
