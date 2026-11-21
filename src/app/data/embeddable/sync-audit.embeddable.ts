import { Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export class SyncAudit {
    @CreateDateColumn({ nullable: false })
    @UpdateDateColumn({ nullable: false })
    receivedAt?: Date;

    @Column({ nullable: true })
    version?: number;

    @Column({ nullable: true })
    createdAt?: Date;

    @Column({ nullable: true })
    createdBy?: string;

    @Column({ nullable: true })
    lastUpdatedAt?: Date;

    @Column({ nullable: true })
    lastUpdatedBy?: string;

    @Column({ nullable: true })
    deactivatedAt?: Date;

    @Column({ nullable: true })
    deactivatedBy?: string;
}
