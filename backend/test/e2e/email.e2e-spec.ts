import * as request from 'supertest';
import { Role } from '../../src/modules/user/entities/user.entity';
import {
  bearer,
  bootstrapE2E,
  closeE2E,
  mintAccessToken,
  seedUser,
  truncateAllTables,
} from './utils/e2e-utils';

describe('Email (e2e)', () => {
  const base = '/email/send';

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

  it('POST /email/send requires auth (negative)', async () => {
    await request(app.getHttpServer()).post(base).send({}).expect(401);
  });

  it('POST /email/send forbids non-admin (negative)', async () => {
    const customer = await seedUser(dataSource, {
      name: 'Customer',
      email: 'customer@example.com',
      role: Role.CUSTOMER,
    });
    const token = mintAccessToken(jwtService, customer);

    await request(app.getHttpServer())
      .post(base)
      .set(bearer(token))
      .send({ to: ['x@y.com'], subject: 'Hi', text: 'Hello' })
      .expect(403);
  });

  it('POST /email/send validates payload (negative)', async () => {
    const admin = await seedUser(dataSource, {
      name: 'Admin',
      email: 'admin@example.com',
      role: Role.ADMINISTRATOR,
    });
    const token = mintAccessToken(jwtService, admin);

    await request(app.getHttpServer())
      .post(base)
      .set(bearer(token))
      .send({ to: ['x@y.com'], subject: '', text: '' })
      .expect(400);
  });

  it('POST /email/send sends email as admin (positive)', async () => {
    const admin = await seedUser(dataSource, {
      name: 'Admin',
      email: 'admin@example.com',
      role: Role.ADMINISTRATOR,
    });
    const token = mintAccessToken(jwtService, admin);

    const res = await request(app.getHttpServer())
      .post(base)
      .set(bearer(token))
      .send({
        to: ['recipient@example.com'],
        subject: 'Hello',
        text: 'Test email',
      })
      .expect(201);

    expect(res.body).toEqual({ message: 'Email sent successfully' });
  });
});
