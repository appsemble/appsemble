import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { EmailAuthorization } from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../utils/test/authorization.js';

let server: Koa;

describe('undeliveredEmails', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    await createTestUser();
  });

  it('should flag users email as disabled after a bounce', async () => {
    authorizeStudio();
    vi.useFakeTimers();
    await request.post('/api/undelivered-emails?secret=test', {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      original_message: {
        id: 1,
      },
      bounce: {
        to: 'test@example.com',
      },
    });

    const emailAuthorization = await EmailAuthorization.findOne({
      where: { email: 'test@example.com' },
    });
    expect(emailAuthorization?.disabled).toStrictEqual(new Date());
    vi.useRealTimers();
  });

  it('should flag users email as disabled after a hard fail', async () => {
    authorizeStudio();
    vi.useFakeTimers();
    await request.post('/api/undelivered-emails?secret=test', {
      status: 'MessageDeliveryFailed',
      message: {
        to: 'test@example.com',
      },
    });

    const emailAuthorization = await EmailAuthorization.findOne({
      where: { email: 'test@example.com' },
    });
    expect(emailAuthorization?.disabled).toStrictEqual(new Date());
    vi.useRealTimers();
  });

  it('should return unauthorized error on missing secret', async () => {
    authorizeStudio();
    const response = await request.post('/api/undelivered-emails?secret=wrong', {
      status: 'MessageDeliveryFailed',
      message: {
        to: 'test@example.com',
      },
    });

    expect(response.data).toMatchObject({
      error: 'Unauthorized',
      message: 'unauthorized',
      statusCode: 401,
    });
  });
});
