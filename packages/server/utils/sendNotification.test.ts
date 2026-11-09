import { createECDH, randomBytes } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import webpush from 'web-push';

import { setArgv } from './argv.js';
import { sendNotification } from './sendNotification.js';
import { countConnections } from './test/countConnections.js';
import { type App, type AppSubscription } from '../models/index.js';

describe('sendNotification', () => {
  beforeEach(() => {
    vi.stubEnv('VITEST_CONF_ALLOW_PRIVATE_IP_PROXY', '');
    setArgv({ host: 'http://localhost' });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(['127.0.0.1', 'localhost'])(
    'should not connect to a push endpoint at %s',
    async (hostname) => {
      const target = await countConnections();
      const { privateKey, publicKey } = webpush.generateVAPIDKeys();
      const userAgentKey = createECDH('prime256v1');
      userAgentKey.generateKeys();
      const app = {
        id: 1,
        OrganizationId: 'org',
        path: 'app',
        vapidPrivateKey: privateKey,
        vapidPublicKey: publicKey,
      } as App;
      const subscription = {
        id: 1,
        auth: randomBytes(16).toString('base64url'),
        endpoint: `https://${hostname}:${target.port}/push`,
        p256dh: userAgentKey.getPublicKey('base64url'),
      } as AppSubscription;

      await expect(
        sendNotification(app, subscription, { title: 'Title', body: 'Body', link: '/' }),
      ).rejects.toThrow(/is not allowed/);
      expect(target.connections).toBe(0);
    },
  );
});
