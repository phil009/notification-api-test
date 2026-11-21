import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { NotificationRecipientType as NotificationTargetType } from '../enums/notification-recipient-type.enum';
import { Notification } from './notification.entity';

@Entity()
export class NotificationTarget {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    type: NotificationTargetType;

    @Column({ nullable: true })
    userId: string;

    @Column({ nullable: true, type: 'uuid' })
    workspaceId: string;

    @Column({ nullable: true })
    role: string;

    @Column({ nullable: true })
    permission: string;

    @Column({ nullable: true, type: 'uuid' })
    tenureId: string;

    @Column({ nullable: true })
    occupantType: string;

    @ManyToOne(() => Notification)
    notification: Notification;
}
