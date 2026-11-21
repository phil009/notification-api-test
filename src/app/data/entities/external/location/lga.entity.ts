import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SyncAudit } from '../../../embeddable/sync-audit.embeddable';
import { State } from './state.entity';

@Entity()
export class Lga {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: false })
    name: string;

    @Column({ nullable: false })
    code: string;

    @ManyToOne(() => State, {
        nullable: true,
        createForeignKeyConstraints: false,
    })
    state: State;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();
}
