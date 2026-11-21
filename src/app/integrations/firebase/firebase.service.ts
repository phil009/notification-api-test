import { Inject } from '@matchmakerjs/di';
import * as firebase from 'firebase-admin';
import { NotificationDao } from '../../dao/notification.dao';
import { AppSession } from '../../data/entities/app-session.entity';
import { Notification } from '../../data/entities/notification.entity';
import { FIREBASE_APP } from './firebase-conf';

export class FirebaseService {
    constructor(
        @Inject(FIREBASE_APP) private firebaseApp: firebase.app.App,
        private notificationDao: NotificationDao,
    ) {}

    async sendNotification(notification: Notification, appSession: AppSession) {
        return this.firebaseApp.messaging().send({
            token: appSession.firebaseToken,
            notification: {
                title: notification.title,
                body: notification.message,
            },
            data: {
                notificationId: notification.id,
                notificationType: notification.type,
                unviewedNotificationCount: (
                    await this.notificationDao.countUnviewedNotifications(appSession.userId)
                )?.toString(),
            },
        });
    }
}
