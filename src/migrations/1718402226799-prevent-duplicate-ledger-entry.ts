import { MigrationInterface, QueryRunner } from 'typeorm';

export class preventDuplicateLedgerEntry1718402226799 implements MigrationInterface {
    name = 'preventDuplicateLedgerEntry1718402226799';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "property_unit_subscription_bill_ledger_entry"
            ADD "original_bill_id" uuid
        `);
        await queryRunner.query(`
            ALTER TABLE "property_unit_subscription_bill_ledger_entry"
            ADD CONSTRAINT "UQ_1e5faa45331231f720ccfed2c06" UNIQUE ("original_bill_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "tenure_bill_ledger_entry"
            ADD "original_bill_id" uuid
        `);
        await queryRunner.query(`
            ALTER TABLE "tenure_bill_ledger_entry"
            ADD CONSTRAINT "UQ_ca4117849816d5c1270480eb7a5" UNIQUE ("original_bill_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "property_owner" ALTER COLUMN "workspace_id" TYPE uuid USING workspace_id::uuid
        `);
        await queryRunner.query(`
            ALTER TABLE "property" ALTER COLUMN "workspace_id" TYPE uuid USING workspace_id::uuid
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "property" ALTER COLUMN "workspace_id" TYPE character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "property_owner" ALTER COLUMN "workspace_id" TYPE character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "tenure_bill_ledger_entry" DROP CONSTRAINT "UQ_ca4117849816d5c1270480eb7a5"
        `);
        await queryRunner.query(`
            ALTER TABLE "tenure_bill_ledger_entry" DROP COLUMN "original_bill_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "property_unit_subscription_bill_ledger_entry" DROP CONSTRAINT "UQ_1e5faa45331231f720ccfed2c06"
        `);
        await queryRunner.query(`
            ALTER TABLE "property_unit_subscription_bill_ledger_entry" DROP COLUMN "original_bill_id"
        `);
    }
}
