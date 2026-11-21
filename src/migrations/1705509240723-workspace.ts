import { MigrationInterface, QueryRunner } from 'typeorm';

export class workspace1705509240723 implements MigrationInterface {
    name = 'workspace1705509240723';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "tenure_service_charge"
        `);
        await queryRunner.query(`
            DROP TABLE "property_unit_type"
        `);
        await queryRunner.query(`
            DROP TABLE "property_unit"
        `);
        await queryRunner.query(`
            DROP TABLE "property_unit_tenure"
        `);
        await queryRunner.query(`
            DROP TABLE "property_unit_occupant"
        `);
    }

    public async down(): Promise<void> {
        // no op
    }
}
