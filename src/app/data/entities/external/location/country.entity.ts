import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { SyncAudit } from '../../../embeddable/sync-audit.embeddable';

@Entity()
export class Country {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: false })
    name: string;

    @Column({ nullable: false })
    code: string;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();
}
