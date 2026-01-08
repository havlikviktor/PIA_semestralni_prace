import * as request from 'supertest';
import { Role } from '../../src/modules/user/entities/user.entity';
import { Language } from '../../src/modules/user/entities/translator-language.entity';
import { ProjectState } from '../../src/modules/project/entities/project.entity';
import {
  bearer,
  bootstrapE2E,
  closeE2E,
  mintAccessToken,
  seedTranslatorLanguages,
  seedUser,
  truncateAllTables,
} from './utils/e2e-utils';

type Tokens = {
  customerToken: string;
  translatorToken: string;
  otherTranslatorToken: string;
  otherCustomerToken: string;
  adminToken: string;
};

describe('Projects (e2e)', () => {
  const base = '/projects';

  let app: Awaited<ReturnType<typeof bootstrapE2E>>['app'];
  let dataSource: Awaited<ReturnType<typeof bootstrapE2E>>['dataSource'];
  let jwtService: Awaited<ReturnType<typeof bootstrapE2E>>['jwtService'];

  const originalFile = Buffer.from('hello');
  const translatedFile = Buffer.from('translated');

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

  async function seedUsersAndTokens(): Promise<{ ids: any; tokens: Tokens }> {
    const customer = await seedUser(dataSource, {
      name: 'Customer',
      email: 'customer@example.com',
      role: Role.CUSTOMER,
    });

    const otherCustomer = await seedUser(dataSource, {
      name: 'Other Customer',
      email: 'customer2@example.com',
      role: Role.CUSTOMER,
    });

    const translator = await seedUser(dataSource, {
      name: 'Translator',
      email: 'translator@example.com',
      role: Role.TRANSLATOR,
    });
    await seedTranslatorLanguages(dataSource, translator.id, [
      Language.ENGLISH,
    ]);

    const otherTranslator = await seedUser(dataSource, {
      name: 'Other Translator',
      email: 'translator2@example.com',
      role: Role.TRANSLATOR,
    });
    await seedTranslatorLanguages(dataSource, otherTranslator.id, [
      Language.ENGLISH,
    ]);

    const admin = await seedUser(dataSource, {
      name: 'Admin',
      email: 'admin@example.com',
      role: Role.ADMINISTRATOR,
    });

    return {
      ids: { customer, otherCustomer, translator, otherTranslator, admin },
      tokens: {
        customerToken: mintAccessToken(jwtService, customer),
        otherCustomerToken: mintAccessToken(jwtService, otherCustomer),
        translatorToken: mintAccessToken(jwtService, translator),
        otherTranslatorToken: mintAccessToken(jwtService, otherTranslator),
        adminToken: mintAccessToken(jwtService, admin),
      },
    };
  }

  async function createAssignedProject(customerId: number, token: string) {
    await request(app.getHttpServer())
      .post(base)
      .set(bearer(token))
      .field('customerId', String(customerId))
      .field('languageCode', Language.ENGLISH)
      .attach('originalFile', originalFile, {
        filename: 'original.txt',
        contentType: 'text/plain',
      })
      .expect(204);

    const listRes = await request(app.getHttpServer())
      .get(base)
      .set(bearer(token))
      .expect(200);

    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThan(0);

    const ids = listRes.body
      .map((p: any) => p?.ProjectId)
      .filter((id: any) => typeof id === 'number');
    expect(ids.length).toBeGreaterThan(0);
    return Math.max(...ids) as number;
  }

  it('POST /projects requires auth (negative)', async () => {
    await request(app.getHttpServer()).post(base).expect(401);
  });

  it('POST /projects rejects missing file (negative)', async () => {
    const { ids, tokens } = await seedUsersAndTokens();

    await request(app.getHttpServer())
      .post(base)
      .set(bearer(tokens.customerToken))
      .field('customerId', String(ids.customer.id))
      .field('languageCode', Language.ENGLISH)
      .expect(422);
  });

  it('POST /projects rejects non-existing customerId (negative)', async () => {
    const { tokens } = await seedUsersAndTokens();

    await request(app.getHttpServer())
      .post(base)
      .set(bearer(tokens.customerToken))
      .field('customerId', '999999')
      .field('languageCode', Language.ENGLISH)
      .attach('originalFile', originalFile, {
        filename: 'original.txt',
        contentType: 'text/plain',
      })
      .expect(400);
  });

  it('GET /projects lists by role (positive)', async () => {
    const { ids, tokens } = await seedUsersAndTokens();

    const projectId = await createAssignedProject(
      ids.customer.id,
      tokens.customerToken,
    );

    const customerList = await request(app.getHttpServer())
      .get(base)
      .set(bearer(tokens.customerToken))
      .expect(200);

    expect(customerList.body[0]).toEqual(
      expect.objectContaining({ ProjectId: projectId }),
    );

    const translatorList = await request(app.getHttpServer())
      .get(base)
      .set(bearer(tokens.translatorToken))
      .expect(200);

    expect(translatorList.body.length).toBe(1);
  });

  it('GET /projects/:id returns project detail (positive)', async () => {
    const { ids, tokens } = await seedUsersAndTokens();

    const projectId = await createAssignedProject(
      ids.customer.id,
      tokens.customerToken,
    );

    const detail = await request(app.getHttpServer())
      .get(`${base}/${projectId}`)
      .set(bearer(tokens.customerToken))
      .expect(200);

    expect(detail.body).toEqual(
      expect.objectContaining({
        ProjectId: projectId,
        customer: expect.objectContaining({ id: ids.customer.id }),
        translator: expect.anything(),
      }),
    );
  });

  it('GET /projects/:id/file forbids other customer (negative)', async () => {
    const { ids, tokens } = await seedUsersAndTokens();

    const projectId = await createAssignedProject(
      ids.customer.id,
      tokens.customerToken,
    );

    await request(app.getHttpServer())
      .get(`${base}/${projectId}/file`)
      .set(bearer(tokens.otherCustomerToken))
      .expect(403);
  });

  it('GET /projects/:id/file downloads original file for customer (positive)', async () => {
    const { ids, tokens } = await seedUsersAndTokens();

    const projectId = await createAssignedProject(
      ids.customer.id,
      tokens.customerToken,
    );

    await request(app.getHttpServer())
      .get(`${base}/${projectId}/file`)
      .set(bearer(tokens.customerToken))
      .expect('Content-Disposition', /attachment/)
      .expect(200);
  });

  it('GET /projects/:id/file?type=translated returns 404 until uploaded (negative)', async () => {
    const { ids, tokens } = await seedUsersAndTokens();

    const projectId = await createAssignedProject(
      ids.customer.id,
      tokens.customerToken,
    );

    await request(app.getHttpServer())
      .get(`${base}/${projectId}/file`)
      .query({ type: 'translated' })
      .set(bearer(tokens.customerToken))
      .expect(404);
  });

  it('POST /projects/:id/file requires translator and assignment (positive + negative)', async () => {
    const { ids, tokens } = await seedUsersAndTokens();
    const projectId = await createAssignedProject(
      ids.customer.id,
      tokens.customerToken,
    );

    // customer cannot upload
    await request(app.getHttpServer())
      .post(`${base}/${projectId}/file`)
      .set(bearer(tokens.customerToken))
      .attach('translatedFile', translatedFile, {
        filename: 'translated.txt',
        contentType: 'text/plain',
      })
      .expect(403);

    // other translator cannot upload
    await request(app.getHttpServer())
      .post(`${base}/${projectId}/file`)
      .set(bearer(tokens.otherTranslatorToken))
      .attach('translatedFile', translatedFile, {
        filename: 'translated.txt',
        contentType: 'text/plain',
      })
      .expect(403);

    // correct translator can upload
    const res = await request(app.getHttpServer())
      .post(`${base}/${projectId}/file`)
      .set(bearer(tokens.translatorToken))
      .attach('translatedFile', translatedFile, {
        filename: 'translated.txt',
        contentType: 'text/plain',
      })
      .expect(201);

    expect(res.body).toEqual(
      expect.objectContaining({
        ProjectId: projectId,
        hasTranslatedFile: true,
      }),
    );
  });

  it('PATCH /projects/:id enforces state transitions (positive + negative)', async () => {
    const { ids, tokens } = await seedUsersAndTokens();
    const projectId = await createAssignedProject(
      ids.customer.id,
      tokens.customerToken,
    );

    // translator cannot complete without translated file
    await request(app.getHttpServer())
      .patch(`${base}/${projectId}`)
      .set(bearer(tokens.translatorToken))
      .send({ state: ProjectState.COMPLETED })
      .expect(400);

    // upload translated file
    await request(app.getHttpServer())
      .post(`${base}/${projectId}/file`)
      .set(bearer(tokens.translatorToken))
      .attach('translatedFile', translatedFile, {
        filename: 'translated.txt',
        contentType: 'text/plain',
      })
      .expect(201);

    // translator completes
    const completed = await request(app.getHttpServer())
      .patch(`${base}/${projectId}`)
      .set(bearer(tokens.translatorToken))
      .send({ state: ProjectState.COMPLETED })
      .expect(200);

    expect(completed.body.state).toBe(ProjectState.COMPLETED);

    // customer cannot approve when not completed (new project)
    const secondProjectId = await createAssignedProject(
      ids.customer.id,
      tokens.customerToken,
    );
    await request(app.getHttpServer())
      .patch(`${base}/${secondProjectId}`)
      .set(bearer(tokens.customerToken))
      .send({ state: ProjectState.APPROVED })
      .expect(400);

    // customer approves completed project
    const approved = await request(app.getHttpServer())
      .patch(`${base}/${projectId}`)
      .set(bearer(tokens.customerToken))
      .send({ state: ProjectState.APPROVED })
      .expect(200);

    expect(approved.body.state).toBe(ProjectState.APPROVED);

    // admin can set any state
    const adminChange = await request(app.getHttpServer())
      .patch(`${base}/${projectId}`)
      .set(bearer(tokens.adminToken))
      .send({ state: ProjectState.REJECTED })
      .expect(200);

    expect(adminChange.body.state).toBe(ProjectState.REJECTED);
  });

  it('POST /projects/:id/feedback requires approved/rejected for customers (positive + negative)', async () => {
    const { ids, tokens } = await seedUsersAndTokens();
    const projectId = await createAssignedProject(
      ids.customer.id,
      tokens.customerToken,
    );

    // customer cannot add feedback while assigned
    await request(app.getHttpServer())
      .post(`${base}/${projectId}/feedback`)
      .set(bearer(tokens.customerToken))
      .send({ text: 'Nice' })
      .expect(400);

    // translator cannot add feedback
    await request(app.getHttpServer())
      .post(`${base}/${projectId}/feedback`)
      .set(bearer(tokens.translatorToken))
      .send({ text: 'Nice' })
      .expect(403);

    // complete + approve then feedback
    await request(app.getHttpServer())
      .post(`${base}/${projectId}/file`)
      .set(bearer(tokens.translatorToken))
      .attach('translatedFile', translatedFile, {
        filename: 'translated.txt',
        contentType: 'text/plain',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`${base}/${projectId}`)
      .set(bearer(tokens.translatorToken))
      .send({ state: ProjectState.COMPLETED })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`${base}/${projectId}`)
      .set(bearer(tokens.customerToken))
      .send({ state: ProjectState.APPROVED })
      .expect(200);

    await request(app.getHttpServer())
      .post(`${base}/${projectId}/feedback`)
      .set(bearer(tokens.customerToken))
      .send({ text: 'Great translation' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`${base}/${projectId}/feedback`)
      .set(bearer(tokens.customerToken))
      .send({ text: 'Duplicate' })
      .expect(400);
  });

  it('PATCH /projects/:id to COMPLETED clears feedback (admin)', async () => {
    const { ids, tokens } = await seedUsersAndTokens();
    const projectId = await createAssignedProject(
      ids.customer.id,
      tokens.customerToken,
    );

    // complete + approve then feedback
    await request(app.getHttpServer())
      .post(`${base}/${projectId}/file`)
      .set(bearer(tokens.translatorToken))
      .attach('translatedFile', translatedFile, {
        filename: 'translated.txt',
        contentType: 'text/plain',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`${base}/${projectId}`)
      .set(bearer(tokens.translatorToken))
      .send({ state: ProjectState.COMPLETED })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`${base}/${projectId}`)
      .set(bearer(tokens.customerToken))
      .send({ state: ProjectState.APPROVED })
      .expect(200);

    await request(app.getHttpServer())
      .post(`${base}/${projectId}/feedback`)
      .set(bearer(tokens.customerToken))
      .send({ text: 'Great translation' })
      .expect(201);

    // admin can set COMPLETED and feedback must be cleared
    await request(app.getHttpServer())
      .patch(`${base}/${projectId}`)
      .set(bearer(tokens.adminToken))
      .send({ state: ProjectState.COMPLETED })
      .expect(200);

    const detail = await request(app.getHttpServer())
      .get(`${base}/${projectId}`)
      .set(bearer(tokens.customerToken))
      .expect(200);

    expect(detail.body.state).toBe(ProjectState.COMPLETED);
    expect(detail.body.feedback).toBeNull();
  });

  it('PATCH /projects/:id to ASSIGNED clears translated file + feedback and reassigns translator (admin)', async () => {
    const { ids, tokens } = await seedUsersAndTokens();
    const projectId = await createAssignedProject(
      ids.customer.id,
      tokens.customerToken,
    );

    // upload + complete + approve + feedback
    await request(app.getHttpServer())
      .post(`${base}/${projectId}/file`)
      .set(bearer(tokens.translatorToken))
      .attach('translatedFile', translatedFile, {
        filename: 'translated.txt',
        contentType: 'text/plain',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`${base}/${projectId}`)
      .set(bearer(tokens.translatorToken))
      .send({ state: ProjectState.COMPLETED })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`${base}/${projectId}`)
      .set(bearer(tokens.customerToken))
      .send({ state: ProjectState.APPROVED })
      .expect(200);

    await request(app.getHttpServer())
      .post(`${base}/${projectId}/feedback`)
      .set(bearer(tokens.customerToken))
      .send({ text: 'Great translation' })
      .expect(201);

    const reassigned = await request(app.getHttpServer())
      .patch(`${base}/${projectId}`)
      .set(bearer(tokens.adminToken))
      .send({ state: ProjectState.ASSIGNED })
      .expect(200);

    // translator exists in fixtures, so it should be assigned again
    expect(reassigned.body.state).toBe(ProjectState.ASSIGNED);

    const detail = await request(app.getHttpServer())
      .get(`${base}/${projectId}`)
      .set(bearer(tokens.customerToken))
      .expect(200);

    expect(detail.body.state).toBe(ProjectState.ASSIGNED);
    expect(detail.body.feedback).toBeNull();

    // translated file should be cleared -> 404
    await request(app.getHttpServer())
      .get(`${base}/${projectId}/file`)
      .query({ type: 'translated' })
      .set(bearer(tokens.customerToken))
      .expect(404);
  });
});
