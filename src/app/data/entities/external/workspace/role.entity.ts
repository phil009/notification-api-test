import { Column, Entity, PrimaryColumn } from 'typeorm';
import { SyncAudit } from '../../../embeddable/sync-audit.embeddable';

@Entity()
export class Role {
    @PrimaryColumn()
    id: string;

    @Column({ nullable: true })
    workspaceId: string;

    @Column({ nullable: false })
    name: string;

    @Column({ nullable: false })
    code: string;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();
}
