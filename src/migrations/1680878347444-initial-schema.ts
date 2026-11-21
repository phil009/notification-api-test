import { MigrationInterface, QueryRunner } from 'typeorm';

export class initialSchema1680878347444 implements MigrationInterface {
    name = 'initialSchema1680878347444';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "role" (
                "id" character varying NOT NULL,
                "workspace_id" character varying,
                "name" character varying NOT NULL,
                "code" character varying NOT NULL,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "portal_user" (
                "user_id" character varying NOT NULL,
                "display_name" character varying NOT NULL,
                "first_name" character varying NOT NULL,
                "last_name" character varying NOT NULL,
                "email_address" character varying NOT NULL,
                "email_address_verified" boolean,
                "phone_number" character varying,
                "profile_picture_url" character varying,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_e29e9f08bff8464ad33348a9e76" PRIMARY KEY ("user_id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "workspace_member" (
                "id" character varying NOT NULL,
                "workspace_id" character varying,
                "is_invitation" boolean,
                "invitation_accepted" boolean,
                "invitation_reviewed_at" TIMESTAMP,
                "invited_user_identifier" character varying,
                "invited_user_identifier_type" character varying,
                "user_id" character varying,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_a3a35f64bf30517010551467c6e" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "workspace_member_role" (
                "id" SERIAL NOT NULL,
                "role_id" character varying NOT NULL,
                "member_id" character varying NOT NULL,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_1f89bf9533ffa200b64f4ef35db" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "user_invitation" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "version" integer NOT NULL,
                "workspace_id" character varying NOT NULL,
                "identifier_type" character varying NOT NULL,
                "identifier" character varying NOT NULL,
                "verification_code_requested_at" TIMESTAMP,
                "notification_sent_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "last_updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "member_id" character varying,
                CONSTRAINT "PK_41026b90b70299ac5dc0183351a" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "user_invitation"
        `);
        await queryRunner.query(`
            DROP TABLE "workspace_member_role"
        `);
        await queryRunner.query(`
            DROP TABLE "workspace_member"
        `);
        await queryRunner.query(`
            DROP TABLE "portal_user"
        `);
        await queryRunner.query(`
            DROP TABLE "role"
        `);
    }
}
