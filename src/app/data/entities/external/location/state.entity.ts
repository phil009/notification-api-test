import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SyncAudit } from '../../../embeddable/sync-audit.embeddable';
import { Country } from './country.entity';

@Entity()
export class State {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: false })
    name: string;

    @Column({ nullable: false })
    code: string;

    @ManyToOne(() => Country, {
        nullable: false,
        createForeignKeyConstraints: false,
    })
    country: Country;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();
}
