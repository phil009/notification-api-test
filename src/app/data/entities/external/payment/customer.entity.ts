import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { SyncAudit } from '../../../embeddable/sync-audit.embeddable';
import { PortalUser } from '../portal-user.entity';
import { Workspace } from '../workspace/workspace.entity';

@Entity('customer')
export class Customer {
    @PrimaryColumn('uuid')
    id: string;

    @Column({ nullable: false })
    type: string;

    @Column({ nullable: false })
    reference: string;

    @ManyToOne(() => PortalUser, { nullable: true, createForeignKeyConstraints: false })
    @JoinColumn({ name: 'user_id' })
    user: PortalUser;

    @ManyToOne(() => Workspace, { nullable: true, createForeignKeyConstraints: false })
    workspace: Workspace;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();
}
