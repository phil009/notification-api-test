import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { SyncAudit } from '../../../embeddable/sync-audit.embeddable';
import { Property } from './property.entity';

@Entity()
export class PropertyUnit {
    @PrimaryColumn('uuid')
    id: string;

    @Column({ nullable: true })
    workspaceId: string;

    @Column({ nullable: true })
    unitNumber: string;

    @Column({ nullable: true })
    referenceCode: string;

    // @OneToOne(() => Address, { nullable: true })
    // @JoinColumn()
    // address: Address;

    @ManyToOne(() => Property, { nullable: true, createForeignKeyConstraints: false })
    location: Property;

    // @Column({ nullable: true })
    // tenuresBillable: boolean;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();
}
