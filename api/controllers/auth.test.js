import bcrypt from 'bcrypt';
import request from 'supertest';

import koaServer from '../server';
import truncate from '../utils/test/truncate';
import testSchema from '../utils/test/testSchema';

describe('auth controller', () => {
  let User;
  let EmailAuthorization;
  let db;
  let server;

  beforeAll(async () => {
    db = await testSchema();

    server = await koaServer({ db });
    ({ User, EmailAuthorization } = db);
  });

  beforeEach(async () => {
    await truncate(db);
  });

  afterAll(async () => {
    await db.close();
  });

  it('should register valid email addresses', async () => {
    const data = { email: 'test@example.com', password: 'password' };
    const response = await request(server)
      .post('/api/email')
      .send(data);

    expect(response.status).toBe(201);

    const email = await EmailAuthorization.findByPrimary('test@example.com');
    const user = await User.findByPrimary(email.UserId);

    expect(user).toBeTruthy();
    expect(email).toBeTruthy();
    expect(email.password).not.toBe('password');
    expect(bcrypt.compareSync(data.password, email.password)).toBeTruthy();
  });

  it('should not register invalid email addresses', async () => {
    const response = await request(server)
      .post('/api/email')
      .send({ email: 'foo', password: 'bar' });

    expect(response.status).toBe(400);
  });

  it('should not register duplicate email addresses', async () => {
    await EmailAuthorization.create({ email: 'test@example.com', password: 'unhashed' });
    const response = await request(server)
      .post('/api/email')
      .send({ email: 'test@example.com', password: 'password' });

    expect(response.status).toBe(409);
  });

  it('should verify existing email addresses', async () => {
    await request(server)
      .post('/api/email')
      .send({ email: 'test@example.com', password: 'password' });
    const email = await EmailAuthorization.findByPrimary('test@example.com');

    expect(email.verified).toBe(false);
    expect(email.key).toBeTruthy();

    const response = await request(server).get(`/api/email/verify?key=${email.key}`);
    expect(response.status).toBe(200);

    await email.reload();
    expect(email.verified).toBe(true);
    expect(email.key).toBeNull();
  });

  it('should not verify empty or invalid keys', async () => {
    const responseA = await request(server).get('/api/email/verify');
    const responseB = await request(server).get('/api/email/verify?key');
    const responseC = await request(server).get('/api/email/verify?key=invalidkey');

    expect(responseA.status).toBe(400);
    expect(responseB.status).toBe(400);
    expect(responseC.status).toBe(404);
  });
});
