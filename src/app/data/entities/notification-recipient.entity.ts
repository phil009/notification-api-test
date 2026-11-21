import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique, VersionColumn } from 'typeorm';
import { AppSession } from './app-session.entity';
import { Notification } from './notification.entity';

@Unique(['notification', 'userId'])
@Entity()
export class NotificationRecipient {
    @PrimaryGeneratedColumn()
    id: number;

    @VersionColumn()
    version: number;

    @Column({ nullable: false })
    userId: string;

    @Column({ nullable: true })
    firstViewedAt: Date;

    @Column({ nullable: true })
    lastViewedAt: Date;

    @Column({ nullable: true })
    viewCount: number;

    @Column({ nullable: true })
    publishedToFirebaseAt: Date;

    @Column({ nullable: true })
    firebaseMessageId: string;

    @ManyToOne(() => AppSession, { nullable: true })
    pushNotificationAppSession: AppSession;

    @ManyToOne(() => Notification, { nullable: false })
    notification: Notification;
}
