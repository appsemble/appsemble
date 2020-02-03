import { createInstance } from 'axios-test-instance';
import bcrypt from 'bcrypt';

import createServer from '../utils/createServer';
import testSchema from '../utils/test/testSchema';
import truncate from '../utils/test/truncate';

describe('auth controller', () => {
  let User;
  let EmailAuthorization;
  let ResetPasswordToken;
  let db;
  let request;
  let server;

  beforeAll(async () => {
    db = await testSchema('auth');

    server = await createServer({ db, argv: { host: 'http://localhost', secret: 'test' } });
    request = await createInstance(server);
    ({ User, ResetPasswordToken, EmailAuthorization } = db.models);
  }, 10e3);

  beforeEach(async () => {
    await truncate(db);
  });

  afterAll(async () => {
    await request.close();
    await db.close();
  });

  it('should register valid email addresses', async () => {
    const data = { email: 'test@example.com', password: 'password' };
    const response = await request.post('/api/email', data);

    expect(response).toMatchObject({
      status: 201,
      data: {},
    });

    const email = await EmailAuthorization.findByPk('test@example.com');
    const user = await User.findByPk(email.UserId);

    expect(user.password).not.toBe('password');
    expect(bcrypt.compareSync(data.password, user.password)).toBe(true);
  });

  it('should not register invalid email addresses', async () => {
    const response = await request.post('/api/email', { email: 'foo', password: 'bar' });

    expect(response).toMatchObject({ status: 400 });
  });

  it('should not register duplicate email addresses', async () => {
    await EmailAuthorization.create({ email: 'test@example.com', password: 'unhashed' });
    const response = await request.post('/api/email', {
      email: 'test@example.com',
      password: 'password',
    });

    expect(response).toMatchObject({ status: 409 });
  });

  it('should verify existing email addresses', async () => {
    await request.post('/api/email', { email: 'test@example.com', password: 'password' });
    const email = await EmailAuthorization.findByPk('test@example.com');

    expect(email.verified).toBe(false);
    expect(email.key).not.toBeNull();

    const response = await request.post('/api/email/verify', { token: email.key });
    expect(response).toMatchObject({ status: 200 });

    await email.reload();
    expect(email.verified).toBe(true);
    expect(email.key).toBeNull();
  });

  it('should not verify empty or invalid keys', async () => {
    const responseA = await request.post('/api/email/verify');
    const responseB = await request.post('/api/email/verify', { token: null });
    const responseC = await request.post('/api/email/verify', { token: 'invalidkey' });

    expect(responseA).toMatchObject({ status: 415 });
    expect(responseB).toMatchObject({ status: 400 });
    expect(responseC).toMatchObject({ status: 404 });
  });

  it('should create a password reset token', async () => {
    const data = { email: 'test@example.com', password: 'password' };
    await request.post('/api/email', data);

    const responseA = await request.post('/api/email/reset/request', { email: data.email });

    const email = await EmailAuthorization.findOne({ where: { email: data.email } });

    const token = await ResetPasswordToken.findOne({
      where: { UserId: email.UserId },
    });

    const responseB = await request.post('/api/email/reset', {
      token: token.token,
      password: 'newPassword',
    });

    const user = await token.getUser();
    await user.reload();

    expect(responseA).toMatchObject({ status: 204 });
    expect(responseB).toMatchObject({ status: 204 });
    expect(bcrypt.compareSync('newPassword', user.password)).toBe(true);

    // Sequelize throws errors when trying to load in null objects.
    await expect(token.reload()).rejects.toThrow(
      'Instance could not be reloaded because it does not exist anymore (find call returned null)',
    );
  });

  it('should not reveal existing emails', async () => {
    const response = await request.post('/api/email/reset/request', {
      email: 'idonotexist@example.com',
    });

    expect(response).toMatchObject({ status: 204 });
  });

  it('should return not found when resetting using a non-existent token', async () => {
    const response = await request.post('/api/email/reset', {
      token: 'idontexist',
      password: 'whatever',
    });

    expect(response).toMatchObject({ status: 404 });
  });
});
