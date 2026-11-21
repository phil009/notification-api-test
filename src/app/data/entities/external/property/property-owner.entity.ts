import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { SyncAudit } from '../../../embeddable/sync-audit.embeddable';
import { Workspace } from '../workspace/workspace.entity';

@Entity()
export class PropertyOwner {
    @PrimaryColumn('uuid')
    id: string;

    @ManyToOne(() => Workspace, { nullable: false, createForeignKeyConstraints: false })
    @JoinColumn()
    workspace: Workspace;

    @Column({ nullable: true })
    title: string;

    @Column({ nullable: true })
    firstName: string;

    @Column({ nullable: true })
    lastName: string;

    @Column({ nullable: true })
    displayName: string;

    @Column({ nullable: true })
    emailAddress: string;

    @Column({ nullable: true })
    phoneNumber: string;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();
}
