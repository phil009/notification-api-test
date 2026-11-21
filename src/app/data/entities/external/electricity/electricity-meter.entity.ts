import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { SyncAudit } from '../../../embeddable/sync-audit.embeddable';
import { PortalUser } from '../portal-user.entity';
import { ElectricityMeterProvider } from './electricity-meter-provider.entity';

@Entity()
export class ElectricityMeter {
    @PrimaryColumn('uuid')
    id: string;

    @ManyToOne(() => ElectricityMeterProvider, { nullable: true, createForeignKeyConstraints: false })
    provider: ElectricityMeterProvider;

    @ManyToOne(() => PortalUser, { nullable: true, createForeignKeyConstraints: false })
    @JoinColumn({ name: 'customer_user_id' })
    portalUser: PortalUser;

    @Column()
    meterNumber: string;

    @Column({ nullable: true })
    meterName: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    phoneNumber: string;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();
}
