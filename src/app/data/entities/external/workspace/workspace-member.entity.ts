import { NoLog } from '@matchmakerjs/typeorm-audit';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { SyncAudit } from '../../../embeddable/sync-audit.embeddable';
import { PortalUser } from '../portal-user.entity';
import { WorkspaceMemberRole } from './workspace-member-role.entity';

@NoLog()
@Entity()
export class WorkspaceMember {
    @PrimaryColumn()
    id: string;

    @ManyToOne(() => PortalUser, { nullable: true, createForeignKeyConstraints: false })
    @JoinColumn({ name: 'user_id' })
    user: PortalUser;

    @Column({ nullable: true })
    workspaceId: string;

    @Column({ nullable: true })
    isInvitation: boolean;

    @Column({ nullable: true })
    invitationAccepted: boolean;

    @Column({ nullable: true })
    invitationReviewedAt: Date;

    @Column({ nullable: true })
    invitedUserIdentifier: string;

    @Column({ nullable: true })
    invitedUserIdentifierType: string;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();

    roles: WorkspaceMemberRole[];
}
