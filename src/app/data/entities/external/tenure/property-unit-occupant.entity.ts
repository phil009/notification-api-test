import { NoLog } from '@matchmakerjs/typeorm-audit';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { OccupantApiResponseTypeEnum } from '../../../../../sdk/occupant-api-sdk';
import { SyncAudit } from '../../../embeddable/sync-audit.embeddable';
import { PortalUser } from '../portal-user.entity';
import { PropertyUnitTenure } from './property-unit-tenure.entity';

@NoLog()
@Entity({ synchronize: false, name: 'property_unit_occupant' })
export class _PropertyUnitOccupant {
    @PrimaryColumn('uuid')
    id: string;

    @Column({ nullable: true })
    lastUnpaidBillNotificationAt: Date;

    @Column({ nullable: true })
    lastManagerNotificationAt: Date;

    @Column({ nullable: true })
    lastRentDueReminderAt: Date;
}

@Entity('property_unit_occupant')
export class PropertyUnitOccupant {
    @PrimaryColumn('uuid')
    id: string;

    @ManyToOne(() => PropertyUnitTenure, {
        nullable: false,
        createForeignKeyConstraints: false,
    })
    tenure: PropertyUnitTenure;

    @Column({ nullable: false })
    type: OccupantApiResponseTypeEnum;

    @ManyToOne(() => PortalUser, {
        nullable: true,
        createForeignKeyConstraints: false,
    })
    @JoinColumn({ name: 'user_id' })
    user: PortalUser;

    @Column({ nullable: true })
    title: string;

    @Column({ nullable: true })
    firstName: string;

    @Column({ nullable: true })
    lastName: string;

    @Column({ nullable: true })
    phoneNumber: string;

    @Column({ nullable: true })
    emailAddress: string;

    @Column({ nullable: true, insert: false, update: false })
    lastUnpaidBillNotificationAt: Date;

    @Column({ nullable: true, insert: false, update: false })
    lastManagerNotificationAt: Date;

    @Column({ nullable: true, insert: false, update: false })
    lastRentDueReminderAt: Date;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();
}
