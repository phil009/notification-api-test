import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from 'typeorm';
import { SyncAudit } from '../../../embeddable/sync-audit.embeddable';
import { Address } from '../../address.entity';
import { NamedRecord } from '../named-record/named-record.entity';
import { Workspace } from '../workspace/workspace.entity';
import { PropertyOwner } from './property-owner.entity';

@Entity()
export class Property {
    @PrimaryColumn('uuid')
    id: string;

    @ManyToOne(() => Workspace, { nullable: true, createForeignKeyConstraints: false })
    @JoinColumn()
    workspace: Workspace;

    @Column('uuid', { array: true, nullable: true })
    supersets: string[];

    @Column({ nullable: true })
    name: string;

    @ManyToOne(() => PropertyOwner, { nullable: true, createForeignKeyConstraints: false })
    owner: PropertyOwner;

    @OneToOne(() => Address, { nullable: true })
    @JoinColumn()
    address: Address;

    @ManyToOne(() => NamedRecord, { nullable: true, createForeignKeyConstraints: false })
    category: NamedRecord;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();

    resolvedSupersets: Property[];
}
