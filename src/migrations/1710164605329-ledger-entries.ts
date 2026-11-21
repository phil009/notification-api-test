import { MigrationInterface, QueryRunner } from 'typeorm';

export class ledgerEntries1710164605329 implements MigrationInterface {
    name = 'ledgerEntries1710164605329';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "offline_payment" (
                "id" uuid NOT NULL,
                "currency" character varying NOT NULL,
                "amount" numeric NOT NULL,
                "payer_name" character varying,
                "payment_date" date NOT NULL,
                "payment_channel" character varying NOT NULL,
                "payment_reference" character varying,
                "comment" character varying,
                "submitted_by" character varying,
                "reviewed_by" character varying,
                "reviewed_at" TIMESTAMP,
                "reason_for_rejection" character varying,
                "status" character varying NOT NULL,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_2f4fcfd42011e262a46f2bf9666" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "property_unit_subscription_ledger" (
                "id" uuid NOT NULL,
                "currency" character varying NOT NULL,
                "sum_of_invoices_issued" numeric NOT NULL,
                "sum_of_payments_received" numeric NOT NULL,
                "workspace_id" uuid,
                "property_owner_id" uuid,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_35cf469e43ae873f9df3c99158a" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "property_unit_subscription_payment" (
                "id" uuid NOT NULL,
                "currency" character varying NOT NULL,
                "amount" numeric NOT NULL,
                "property_unit_subscription_ledger_id" uuid NOT NULL,
                "wallet_transaction_id" uuid,
                "split_payment_id" uuid,
                "offline_payment_id" uuid,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_cf883be44387dc3a7374a3d3c22" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "property_unit_registration_bill" (
                "id" uuid NOT NULL,
                "amount" numeric NOT NULL,
                "currency" character varying NOT NULL,
                "period_type" character varying,
                "period_type_fee" numeric,
                "period_length" integer,
                "started_at" TIMESTAMP,
                "ended_at" TIMESTAMP,
                "property_unit_id" uuid NOT NULL,
                "payment_id" uuid,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_12323795e3a69448ab9515d27f2" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "split_payment" (
                "id" uuid NOT NULL,
                "currency" character varying NOT NULL,
                "amount" numeric NOT NULL,
                "status" character varying NOT NULL,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_dcaa058b4dd26f1e27981570ed4" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "property_unit_subscription_bill_ledger_entry" (
                "id" uuid NOT NULL,
                "amount" numeric NOT NULL,
                "currency" character varying NOT NULL,
                "effective_at" TIMESTAMP,
                "started_at" TIMESTAMP,
                "ended_at" TIMESTAMP,
                "property_unit_subscription_ledger_id" uuid NOT NULL,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_1d156894720832eccb42290784a" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "tenure_ledger" (
                "id" uuid NOT NULL,
                "type" character varying NOT NULL,
                "currency" character varying NOT NULL,
                "sum_of_invoices_issued" numeric NOT NULL,
                "sum_of_payments_received" numeric NOT NULL,
                "tenure_id" uuid NOT NULL,
                "defaulted_at" TIMESTAMP,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_9bcb5d780888def729be4bd331f" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "tenure_bill_ledger_entry" (
                "id" uuid NOT NULL,
                "ledger_type" character varying NOT NULL,
                "amount" numeric NOT NULL,
                "currency" character varying NOT NULL,
                "effective_at" TIMESTAMP,
                "started_at" TIMESTAMP,
                "ended_at" TIMESTAMP,
                "expiry_notice_at" TIMESTAMP,
                "tenure_id" uuid NOT NULL,
                "tenure_ledger_id" uuid NOT NULL,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_7c044e85d32463a3bda47766c53" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "tenure_payment" (
                "id" uuid NOT NULL,
                "currency" character varying NOT NULL,
                "amount" numeric NOT NULL,
                "tenure_ledger_id" uuid NOT NULL,
                "wallet_transaction_id" uuid,
                "offline_payment_id" uuid,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" integer,
                "created_at" TIMESTAMP,
                "created_by" character varying,
                "last_updated_at" TIMESTAMP,
                "last_updated_by" character varying,
                "deactivated_at" TIMESTAMP,
                "deactivated_by" character varying,
                CONSTRAINT "PK_8ac6e9022118fa383223fffa189" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "property_unit" DROP CONSTRAINT "REL_c986b38f9f38fab6c4f130b310"
        `);
        await queryRunner.query(`
            ALTER TABLE "property_unit" DROP COLUMN "address_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "wallet_transaction"
            ADD "split_payment_id" uuid
        `);
        await queryRunner.query(`
            ALTER TABLE "notification" DROP CONSTRAINT "UQ_c8858d01fe1f0fe88a38c5a9acf"
        `);
        await queryRunner.query(`
            ALTER TABLE "notification"
            ALTER COLUMN "source_reference" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "notification"
            ADD CONSTRAINT "UQ_c8858d01fe1f0fe88a38c5a9acf" UNIQUE ("type", "source_reference")
        `);
        await queryRunner.query(`
            ALTER TABLE "notification_recipient"
            ADD CONSTRAINT "FK_748a616bfc220d4fd31d88c48ee" FOREIGN KEY ("push_notification_app_session_id") REFERENCES "app_session"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "notification_recipient" DROP CONSTRAINT "FK_748a616bfc220d4fd31d88c48ee"
        `);
        await queryRunner.query(`
            ALTER TABLE "notification" DROP CONSTRAINT "UQ_c8858d01fe1f0fe88a38c5a9acf"
        `);
        await queryRunner.query(`
            ALTER TABLE "notification"
            ALTER COLUMN "source_reference"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "notification"
            ADD CONSTRAINT "UQ_c8858d01fe1f0fe88a38c5a9acf" UNIQUE ("type", "source_reference")
        `);
        await queryRunner.query(`
            ALTER TABLE "wallet_transaction" DROP COLUMN "split_payment_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "property_unit"
            ADD "address_id" integer
        `);
        await queryRunner.query(`
            ALTER TABLE "property_unit"
            ADD CONSTRAINT "REL_c986b38f9f38fab6c4f130b310" UNIQUE ("address_id")
        `);
        await queryRunner.query(`
            DROP TABLE "tenure_payment"
        `);
        await queryRunner.query(`
            DROP TABLE "tenure_bill_ledger_entry"
        `);
        await queryRunner.query(`
            DROP TABLE "tenure_ledger"
        `);
        await queryRunner.query(`
            DROP TABLE "property_unit_subscription_bill_ledger_entry"
        `);
        await queryRunner.query(`
            DROP TABLE "split_payment"
        `);
        await queryRunner.query(`
            DROP TABLE "property_unit_registration_bill"
        `);
        await queryRunner.query(`
            DROP TABLE "property_unit_subscription_payment"
        `);
        await queryRunner.query(`
            DROP TABLE "property_unit_subscription_ledger"
        `);
        await queryRunner.query(`
            DROP TABLE "offline_payment"
        `);
    }
}
