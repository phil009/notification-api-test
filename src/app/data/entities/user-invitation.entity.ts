import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn,
} from 'typeorm';
import { WorkspaceMember } from './external/workspace/workspace-member.entity';

@Entity()
export class UserInvitation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @VersionColumn()
    version: number;

    @ManyToOne(() => WorkspaceMember, { nullable: true, createForeignKeyConstraints: false })
    member: WorkspaceMember;

    @Column({ nullable: false })
    workspaceId: string;

    @Column({ nullable: false })
    identifierType: string;

    @Column({ nullable: false })
    identifier: string;

    @Column({ nullable: true })
    verificationCodeRequestedAt: Date;

    @Column({ nullable: true })
    notificationSentAt: Date;

    @CreateDateColumn()
    createdAt?: Date;

    @UpdateDateColumn()
    lastUpdatedAt?: Date;
}
