import { Column, Entity, PrimaryColumn } from 'typeorm';
import { LocationApiResponseTypeEnum } from '../../../../../sdk/reference-data-api-sdk';
import { SyncAudit } from '../../../embeddable/sync-audit.embeddable';
import { NamedRecordType } from '../../../enums/nested-record-type.enum';

@Entity()
export class NamedRecord {
    @PrimaryColumn('uuid')
    id: string;

    @Column({ nullable: false })
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    code: string;

    @Column({ nullable: true })
    displayPictureUrl: string;

    @Column((_) => SyncAudit, { prefix: false })
    audit: SyncAudit = new SyncAudit();

    ancestors: NamedRecord[];
    sibblings: NamedRecord[];
    parentId: string;
    numberOfChildren: number;

    @Column({ nullable: false })
    type: NamedRecordType | LocationApiResponseTypeEnum;
}
