import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { NamedRecord } from './named-record.entity';

@Entity()
export class NamedRecordRelationship {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => NamedRecord, {
        nullable: false,
        createForeignKeyConstraints: false,
    })
    target: NamedRecord;

    @ManyToOne(() => NamedRecord, {
        nullable: false,
        createForeignKeyConstraints: false,
    })
    source: NamedRecord;

    @Column({ nullable: true })
    distance: number;
}
