// src/test/user.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/modules/app.module';

describe('User Module (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    // Ideally, obtain a token here via a setup/seed or mock auth.
    // Assuming we have a way to generate a valid JWT for testing or use a seed user.
    // For now, these tests will likely fail 401 without a valid token mechanism in place for test env.
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /user should return 401 without token', () => {
    return request(app.getHttpServer()).get('/user').expect(401);
  });
});
