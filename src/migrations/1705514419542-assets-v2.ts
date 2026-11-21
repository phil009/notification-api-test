import { MigrationInterface, QueryRunner } from 'typeorm';

export class assetsV21705514419542 implements MigrationInterface {
    name = 'assetsV21705514419542';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "property_owner" (
                "id" uuid NOT NULL,
                "workspace_id" character varying NOT NULL,
                "title" character varying,
                "first_name" character varying,
                "last_name" character varying,
                "display_name" character varying,
                "email_address" character varying,
                "phone_number" character varying,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_2541d2fb798d385a0521553370d" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "property" (
                "id" uuid NOT NULL,
                "workspace_id" character varying,
                "supersets" uuid array,
                "name" character varying,
                "owner_id" uuid,
                "address_id" integer,
                "category_id" uuid,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "REL_d3a7ce3f61b608f57e46fb2921" UNIQUE ("address_id"),
                CONSTRAINT "PK_d80743e6191258a5003d5843b4f" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "property_unit" (
                "id" uuid NOT NULL,
                "workspace_id" character varying,
                "unit_number" character varying,
                "reference_code" character varying,
                "address_id" integer,
                "location_id" uuid,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "REL_c986b38f9f38fab6c4f130b310" UNIQUE ("address_id"),
                CONSTRAINT "PK_709ee9f48a228162c82fcfaed31" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "property_unit_tenure" (
                "id" uuid NOT NULL,
                "started_at" TIMESTAMP,
                "ended_at" TIMESTAMP,
                "expiry_notice_at" TIMESTAMP,
                "property_unit_id" uuid NOT NULL,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_9b8b0528469f64651a93144baaa" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "property_unit_occupant" (
                "id" uuid NOT NULL,
                "type" character varying NOT NULL,
                "user_id" character varying,
                "title" character varying,
                "first_name" character varying,
                "last_name" character varying,
                "phone_number" character varying,
                "email_address" character varying,
                "tenure_id" uuid NOT NULL,
                "last_unpaid_bill_notification_at" TIMESTAMP,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_9fc74eb9ad0d6fa5202322158ce" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "property"
            ADD CONSTRAINT "FK_d3a7ce3f61b608f57e46fb2921c" FOREIGN KEY ("address_id") REFERENCES "address"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "property" DROP CONSTRAINT "FK_d3a7ce3f61b608f57e46fb2921c"
        `);
        await queryRunner.query(`
            DROP TABLE "property_unit_occupant"
        `);
        await queryRunner.query(`
            DROP TABLE "property_unit_tenure"
        `);
        await queryRunner.query(`
            DROP TABLE "property_unit"
        `);
        await queryRunner.query(`
            DROP TABLE "property"
        `);
        await queryRunner.query(`
            DROP TABLE "property_owner"
        `);
    }
}
