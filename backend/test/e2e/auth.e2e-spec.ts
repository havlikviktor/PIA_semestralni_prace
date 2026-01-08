import * as request from 'supertest';
import { AuthService } from '../../src/modules/auth/auth.service';
import { UserService } from '../../src/modules/user/user.service';
import { bootstrapE2E, closeE2E, truncateAllTables } from './utils/e2e-utils';

describe('Auth (e2e)', () => {
  const base = '/auth';

  let app: Awaited<ReturnType<typeof bootstrapE2E>>['app'];
  let dataSource: Awaited<ReturnType<typeof bootstrapE2E>>['dataSource'];

  beforeAll(async () => {
    const boot = await bootstrapE2E();
    app = boot.app;
    dataSource = boot.dataSource;
  });

  afterAll(async () => {
    await closeE2E(app);
  });

  beforeEach(async () => {
    await truncateAllTables(dataSource);
  });

  it('POST /auth/signup creates user and returns token (positive)', async () => {
    const res = await request(app.getHttpServer())
      .post(`${base}/signup`)
      .send({ name: 'John', email: 'john@example.com', password: 'pass123' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        user: expect.objectContaining({
          id: expect.any(Number),
          email: 'john@example.com',
          name: 'John',
        }),
      }),
    );
  });

  it('POST /auth/signup rejects invalid payload (negative)', async () => {
    await request(app.getHttpServer())
      .post(`${base}/signup`)
      .send({ name: '', email: 'not-an-email', password: '' })
      .expect(400);
  });

  it('POST /auth/signup rejects duplicate email (negative)', async () => {
    await request(app.getHttpServer())
      .post(`${base}/signup`)
      .send({ name: 'John', email: 'dup@example.com', password: 'pass123' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`${base}/signup`)
      .send({ name: 'Jane', email: 'dup@example.com', password: 'pass456' })
      .expect(409);
  });

  it('POST /auth/login returns token for valid credentials (positive)', async () => {
    await request(app.getHttpServer())
      .post(`${base}/signup`)
      .send({ name: 'John', email: 'john@example.com', password: 'pass123' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post(`${base}/login`)
      .send({ email: 'john@example.com', password: 'pass123' });

    expect([200, 201]).toContain(res.status);
    expect(res.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        user: expect.objectContaining({
          id: expect.any(Number),
          email: 'john@example.com',
        }),
      }),
    );
  });

  it('POST /auth/login rejects wrong password (negative)', async () => {
    await request(app.getHttpServer())
      .post(`${base}/signup`)
      .send({ name: 'John', email: 'john@example.com', password: 'pass123' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`${base}/login`)
      .send({ email: 'john@example.com', password: 'wrong' })
      .expect(401);
  });

  it('POST /auth/ticket exchanges ticket once (positive + negative)', async () => {
    await request(app.getHttpServer())
      .post(`${base}/signup`)
      .send({ name: 'John', email: 'john@example.com', password: 'pass123' })
      .expect(201);

    const authService = app.get(AuthService);
    const userService = app.get(UserService);

    const userDomain = await userService.findByEmail('john@example.com');
    expect(userDomain).toBeTruthy();

    const token = authService.signToken(userDomain!);
    const ticket = authService.generateTicket(token, userDomain!);

    const res = await request(app.getHttpServer())
      .post(`${base}/ticket`)
      .send({ ticket })
      .expect(201);

    expect(res.body).toEqual(
      expect.objectContaining({
        accessToken: token,
        user: expect.objectContaining({ email: 'john@example.com' }),
      }),
    );

    await request(app.getHttpServer())
      .post(`${base}/ticket`)
      .send({ ticket })
      .expect(404);
  });

  it('POST /auth/ticket rejects invalid ticket (negative)', async () => {
    await request(app.getHttpServer())
      .post(`${base}/ticket`)
      .send({ ticket: 'not-a-real-ticket' })
      .expect(404);
  });
});
