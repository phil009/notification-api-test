import { NoLog } from '@matchmakerjs/typeorm-audit';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SyncAudit } from '../../../embeddable/sync-audit.embeddable';
import { Role } from './role.entity';
import { WorkspaceMember } from './workspace-member.entity';

@NoLog()
@Entity()
export class WorkspaceMemberRole {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Role, { nullable: false, createForeignKeyConstraints: false })
    role: Role;

    @ManyToOne(() => WorkspaceMember, { nullable: false, createForeignKeyConstraints: false })
    member: WorkspaceMember;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();
}
