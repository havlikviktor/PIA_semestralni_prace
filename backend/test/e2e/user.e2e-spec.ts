import * as request from 'supertest';
import { Role } from '../../src/modules/user/entities/user.entity';
import { Language } from '../../src/modules/user/entities/translator-language.entity';
import {
  bearer,
  bootstrapE2E,
  closeE2E,
  mintAccessToken,
  seedUser,
  truncateAllTables,
} from './utils/e2e-utils';

describe('User (e2e)', () => {
  const base = '/user';

  let app: Awaited<ReturnType<typeof bootstrapE2E>>['app'];
  let dataSource: Awaited<ReturnType<typeof bootstrapE2E>>['dataSource'];
  let jwtService: Awaited<ReturnType<typeof bootstrapE2E>>['jwtService'];

  beforeAll(async () => {
    const boot = await bootstrapE2E();
    app = boot.app;
    dataSource = boot.dataSource;
    jwtService = boot.jwtService;
  });

  afterAll(async () => {
    await closeE2E(app);
  });

  beforeEach(async () => {
    await truncateAllTables(dataSource);
  });

  it('GET /user requires auth (negative)', async () => {
    await request(app.getHttpServer()).get(base).expect(401);
  });

  it('GET /user returns current user info (positive)', async () => {
    const customer = await seedUser(dataSource, {
      name: 'Customer',
      email: 'customer@example.com',
      role: Role.CUSTOMER,
    });
    const token = mintAccessToken(jwtService, customer);

    const res = await request(app.getHttpServer())
      .get(base)
      .set(bearer(token))
      .expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({
        id: customer.id,
        email: 'customer@example.com',
        role: Role.CUSTOMER,
      }),
    );
  });

  it('GET /user rejects token for non-existing user (negative)', async () => {
    const fakeToken = jwtService.sign({
      sub: 999999,
      name: 'Ghost',
      role: Role.CUSTOMER,
    });

    await request(app.getHttpServer())
      .get(base)
      .set(bearer(fakeToken))
      .expect(401);
  });

  it('PATCH /user/:id forbids non-admin from assigning administrator (negative)', async () => {
    const requester = await seedUser(dataSource, {
      name: 'Requester',
      email: 'req@example.com',
      role: Role.CUSTOMER,
    });
    const target = await seedUser(dataSource, {
      name: 'Target',
      email: 'target@example.com',
      role: Role.CUSTOMER,
    });

    const token = mintAccessToken(jwtService, requester);

    await request(app.getHttpServer())
      .patch(`${base}/${target.id}`)
      .set(bearer(token))
      .send({ role: Role.ADMINISTRATOR })
      .expect(403);
  });

  it('PATCH /user/:id requires languages when setting translator (negative)', async () => {
    const admin = await seedUser(dataSource, {
      name: 'Admin',
      email: 'admin@example.com',
      role: Role.ADMINISTRATOR,
    });
    const target = await seedUser(dataSource, {
      name: 'Target',
      email: 'target@example.com',
      role: Role.CUSTOMER,
    });

    const token = mintAccessToken(jwtService, admin);

    await request(app.getHttpServer())
      .patch(`${base}/${target.id}`)
      .set(bearer(token))
      .send({ role: Role.TRANSLATOR })
      .expect(409);
  });

  it('PATCH /user/:id sets translator role with languages (positive)', async () => {
    const admin = await seedUser(dataSource, {
      name: 'Admin',
      email: 'admin@example.com',
      role: Role.ADMINISTRATOR,
    });
    const target = await seedUser(dataSource, {
      name: 'Target',
      email: 'target@example.com',
      role: Role.CUSTOMER,
    });

    const token = mintAccessToken(jwtService, admin);

    const res = await request(app.getHttpServer())
      .patch(`${base}/${target.id}`)
      .set(bearer(token))
      .send({ role: Role.TRANSLATOR, languages: [Language.ENGLISH] }) //blabla
      .expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({
        id: target.id,
        role: Role.TRANSLATOR,
      }),
    );
  });

  it('PATCH /user/:id returns 404 for missing user (negative)', async () => {
    const admin = await seedUser(dataSource, {
      name: 'Admin',
      email: 'admin@example.com',
      role: Role.ADMINISTRATOR,
    });

    const token = mintAccessToken(jwtService, admin);

    await request(app.getHttpServer())
      .patch(`${base}/999999`)
      .set(bearer(token))
      .send({ role: Role.CUSTOMER })
      .expect(404);
  });
});
