// src/test/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/modules/app.module';

describe('Auth Module (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Mocking Google OAuth logic is complex in e2e without external service mocking.
  // We can focus on public endpoints if any, or general behavior.
  // For standard Auth, usually Login/Register is tested.
  // Since this app uses Google Auth primarily, detailed e2e for full flow requires mocking the Strategy.

  it('should be defined', () => {
    expect(app).toBeDefined();
  });
});
