import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { SyncAudit } from '../../../embeddable/sync-audit.embeddable';

@Entity()
export class ElectricityMeterProvider {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    vendor: string;

    @Column()
    providerId: string;

    @Column()
    name: string;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();
}
