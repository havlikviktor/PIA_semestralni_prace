import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class SeedAdminUser20260201000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const password = process.env.ADMIN_PASSWORD;
    if (!password) throw new Error('ADMIN_PASSWORD is not set');

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    await queryRunner.query(
      `INSERT INTO "user_entity" ("email", "name", "role", "password") 
       VALUES ('admin@pia.com', 'Administrator', 'administrator', '${hashedPassword}')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "user_entity" WHERE "email" = 'admin@pia.com'`,
    );
  }
}
