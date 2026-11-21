import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class AppSession {
    @PrimaryColumn()
    id: string;

    @Column({ nullable: false })
    userId: string;

    @Column({ nullable: true })
    identifier: string;

    @Column({ nullable: false })
    authenticationType: string;

    @Column({ nullable: false })
    startedAt: Date;

    @Column({ nullable: true })
    endedAt: Date;

    @Column({ nullable: false })
    expiresAt: Date;

    @Column({ nullable: true })
    lastSeenAt: Date;

    @Column({ nullable: false })
    applicationId: string;

    @Column({ nullable: false })
    applicationVersion: string;

    @Column({ nullable: false })
    firebaseToken: string;
}
