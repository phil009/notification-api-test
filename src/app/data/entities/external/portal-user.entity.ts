import { NoLog } from '@matchmakerjs/typeorm-audit';
import { Column, Entity, PrimaryColumn } from 'typeorm';
import { SyncAudit } from '../../embeddable/sync-audit.embeddable';

@NoLog()
@Entity()
export class PortalUser {
    @PrimaryColumn()
    userId: string;

    @Column({ nullable: false })
    displayName: string;

    @Column({ nullable: false })
    firstName: string;

    @Column({ nullable: false })
    lastName: string;

    @Column({ nullable: false })
    emailAddress: string;

    @Column({ nullable: true })
    emailAddressVerified: boolean;

    @Column({ nullable: true })
    phoneNumber: string;

    @Column({ nullable: true })
    profilePictureUrl: string;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();
}
