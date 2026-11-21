import { MigrationInterface, QueryRunner } from 'typeorm';

export class offlinePaymentNotification1725709591983 implements MigrationInterface {
    name = 'offlinePaymentNotification1725709591983';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "offline_payment"
            ADD "workspace_id" uuid
        `);
        await queryRunner.query(`
            ALTER TABLE "offline_payment"
            ADD "notification_id" uuid
        `);
        await queryRunner.query(`
            ALTER TABLE "offline_payment"
            ADD CONSTRAINT "UQ_c76c5bb71a8bb7a2a4e80c57a8f" UNIQUE ("notification_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "wallet_transaction" DROP CONSTRAINT "FK_ba06035843fe7d6220eabeb8e83"
        `);
        await queryRunner.query(`
            ALTER TABLE "wallet_transaction"
            ADD CONSTRAINT "UQ_ba06035843fe7d6220eabeb8e83" UNIQUE ("notification_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "electricity_unit_purchase" DROP CONSTRAINT "FK_e0a7d303b2fbdf5c455a2d9db55"
        `);
        await queryRunner.query(`
            ALTER TABLE "electricity_unit_purchase"
            ADD CONSTRAINT "UQ_e0a7d303b2fbdf5c455a2d9db55" UNIQUE ("notification_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "offline_payment"
            ADD CONSTRAINT "FK_c76c5bb71a8bb7a2a4e80c57a8f" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "wallet_transaction"
            ADD CONSTRAINT "FK_ba06035843fe7d6220eabeb8e83" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "electricity_unit_purchase"
            ADD CONSTRAINT "FK_e0a7d303b2fbdf5c455a2d9db55" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "electricity_unit_purchase" DROP CONSTRAINT "FK_e0a7d303b2fbdf5c455a2d9db55"
        `);
        await queryRunner.query(`
            ALTER TABLE "wallet_transaction" DROP CONSTRAINT "FK_ba06035843fe7d6220eabeb8e83"
        `);
        await queryRunner.query(`
            ALTER TABLE "offline_payment" DROP CONSTRAINT "FK_c76c5bb71a8bb7a2a4e80c57a8f"
        `);
        await queryRunner.query(`
            ALTER TABLE "electricity_unit_purchase" DROP CONSTRAINT "UQ_e0a7d303b2fbdf5c455a2d9db55"
        `);
        await queryRunner.query(`
            ALTER TABLE "electricity_unit_purchase"
            ADD CONSTRAINT "FK_e0a7d303b2fbdf5c455a2d9db55" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "wallet_transaction" DROP CONSTRAINT "UQ_ba06035843fe7d6220eabeb8e83"
        `);
        await queryRunner.query(`
            ALTER TABLE "wallet_transaction"
            ADD CONSTRAINT "FK_ba06035843fe7d6220eabeb8e83" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "offline_payment" DROP CONSTRAINT "UQ_c76c5bb71a8bb7a2a4e80c57a8f"
        `);
        await queryRunner.query(`
            ALTER TABLE "offline_payment" DROP COLUMN "notification_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "offline_payment" DROP COLUMN "workspace_id"
        `);
    }
}
