import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../../../src/modules/app.module';
import {
  Role,
  UserEntity,
} from '../../../src/modules/user/entities/user.entity';
import {
  Language,
  TranslatorLanguage,
} from '../../../src/modules/user/entities/translator-language.entity';

export interface BootstrappedE2E {
  app: INestApplication;
  dataSource: DataSource;
  jwtService: JwtService;
}

export async function bootstrapE2E(): Promise<BootstrappedE2E> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe());
  await app.init();

  return {
    app,
    dataSource: app.get(DataSource),
    jwtService: app.get(JwtService),
  };
}

export async function closeE2E(app: INestApplication) {
  await app.close();
}

export async function truncateAllTables(dataSource: DataSource) {
  const rows: Array<{ tablename: string }> = await dataSource.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
  );

  const tableNames = rows
    .map((r) => r.tablename)
    .filter((name) => name !== 'migrations');

  if (tableNames.length === 0) {
    return;
  }

  const joined = tableNames.map((t) => `"${t}"`).join(', ');
  await dataSource.query(`TRUNCATE TABLE ${joined} RESTART IDENTITY CASCADE`);
}

export async function seedUser(
  dataSource: DataSource,
  user: Partial<UserEntity> & Pick<UserEntity, 'email' | 'name' | 'role'>,
): Promise<UserEntity> {
  const repo = dataSource.getRepository(UserEntity);
  const entity = repo.create({
    password: null,
    googleId: null,
    ...user,
  });
  return repo.save(entity);
}

export async function seedTranslatorLanguages(
  dataSource: DataSource,
  translatorId: number,
  languages: Language[],
) {
  const repo = dataSource.getRepository(TranslatorLanguage);
  const entities = languages.map((languageCode) =>
    repo.create({
      translatorId,
      translator: { id: translatorId } as any,
      languageCode,
    }),
  );
  await repo.save(entities);
}

export function mintAccessToken(jwtService: JwtService, user: UserEntity) {
  return jwtService.sign({
    sub: user.id,
    name: user.name,
    role: user.role,
  });
}

export function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}
