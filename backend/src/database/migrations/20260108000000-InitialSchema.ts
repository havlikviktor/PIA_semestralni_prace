import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema20260108000000 implements MigrationInterface {
  name = 'InitialSchema20260108000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "translator_language" ("translatorId" integer NOT NULL, "languageCode" character varying NOT NULL, CONSTRAINT "PK_61e60c0ed4a455171c9d925d89b" PRIMARY KEY ("translatorId", "languageCode"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_entity_role_enum" AS ENUM('customer', 'translator', 'administrator')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_entity" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "password" character varying, "email" character varying NOT NULL, "googleId" character varying, "role" "public"."user_entity_role_enum" NOT NULL DEFAULT 'customer', CONSTRAINT "UQ_415c35b9b3b6fe45a3b065030f5" UNIQUE ("email"), CONSTRAINT "PK_b54f8ea623b17094db7667d8206" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "project_entity" ("ProjectId" SERIAL NOT NULL, "languageCode" character varying NOT NULL, "fileName" character varying NOT NULL, "originalFile" bytea NOT NULL, "translatedFile" bytea, "state" character varying NOT NULL DEFAULT 'created', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "customerId" integer, "translatorId" integer, CONSTRAINT "PK_9d206e8e40fbdfe868470abb888" PRIMARY KEY ("ProjectId"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "project_feedback_entity" ("projectId" integer NOT NULL, "text" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7bae7e414c70264333b46c19d6e" PRIMARY KEY ("projectId"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "translator_language" ADD CONSTRAINT "FK_adfa83f47eb5d696e364c9c6418" FOREIGN KEY ("translatorId") REFERENCES "user_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_entity" ADD CONSTRAINT "FK_6a519c02fd839683f7cb1328e73" FOREIGN KEY ("customerId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_entity" ADD CONSTRAINT "FK_0724b193a0e16a75502fb773530" FOREIGN KEY ("translatorId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_feedback_entity" ADD CONSTRAINT "FK_7bae7e414c70264333b46c19d6e" FOREIGN KEY ("projectId") REFERENCES "project_entity"("ProjectId") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project_feedback_entity" DROP CONSTRAINT "FK_7bae7e414c70264333b46c19d6e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_entity" DROP CONSTRAINT "FK_0724b193a0e16a75502fb773530"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_entity" DROP CONSTRAINT "FK_6a519c02fd839683f7cb1328e73"`,
    );
    await queryRunner.query(
      `ALTER TABLE "translator_language" DROP CONSTRAINT "FK_adfa83f47eb5d696e364c9c6418"`,
    );
    await queryRunner.query(`DROP TABLE "project_feedback_entity"`);
    await queryRunner.query(`DROP TABLE "project_entity"`);
    await queryRunner.query(`DROP TABLE "user_entity"`);
    await queryRunner.query(`DROP TYPE "public"."user_entity_role_enum"`);
    await queryRunner.query(`DROP TABLE "translator_language"`);
  }
}

