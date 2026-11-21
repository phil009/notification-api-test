import {MigrationInterface, QueryRunner} from "typeorm";

export class customer1777809557080 implements MigrationInterface {
    name = 'customer1777809557080'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "customer" (
                "id" uuid NOT NULL,
                "type" character varying NOT NULL,
                "reference" character varying NOT NULL,
                "user_id" character varying,
                "workspace_id" uuid,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_a7a13f4cacb744524e44dfdad32" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "customer_wallet" (
                "id" uuid NOT NULL,
                "wallet_id" uuid NOT NULL,
                "customer_id" uuid NOT NULL,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_d72b4879e23dbcf65a3781ce5c3" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "wallet"
            ADD "customer_id" uuid
        `);
        await queryRunner.query(`
            ALTER TABLE "wallet_transaction"
            ADD "customer_id" uuid
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "wallet_transaction" DROP COLUMN "customer_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "wallet" DROP COLUMN "customer_id"
        `);
        await queryRunner.query(`
            DROP TABLE "customer_wallet"
        `);
        await queryRunner.query(`
            DROP TABLE "customer"
        `);
    }

}
