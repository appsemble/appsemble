import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, describe, expect, it } from 'vitest';

import { setArgv } from '../../utils/argv.js';
import { createServer } from '../../utils/createServer.js';

describe('getSubscriptionPlans', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  it('should list every plan without authentication, from free to enterprise', async () => {
    const response = await request.get('/api/subscription-plans');

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('public,max-age=300');
    expect(response.data).toStrictEqual([
      expect.objectContaining({
        name: 'free',
        price: '0',
        appLimit: 3,
        customContainers: false,
      }),
      expect.objectContaining({ name: 'basic', price: '5', customContainers: false }),
      expect.objectContaining({ name: 'standard', price: '25', customContainers: false }),
      expect.objectContaining({
        name: 'extensive',
        price: '50',
        dailyNotifications: 'unlimited',
        customContainers: true,
      }),
      expect.objectContaining({
        name: 'enterprise',
        price: '100',
        dailyNotifications: 'unlimited',
        customContainers: true,
      }),
    ]);
  });

  it('should report unlimited values as unlimited', async () => {
    const response = await request.get('/api/subscription-plans');

    expect(response.data).toContainEqual(
      expect.objectContaining({
        name: 'enterprise',
        appLimit: 'unlimited',
        dailyNotifications: 'unlimited',
      }),
    );
    expect(JSON.stringify(response.data)).not.toContain('null');
  });
});
