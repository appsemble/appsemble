import { beforeEach, describe, expect, it } from 'vitest';

import { reencryptSecrets } from './reencryptSecrets.js';
import { App, getAppDB, Organization } from '../models/index.js';
import { decrypt, encrypt } from '../utils/crypto.js';

const OLD_AES_SECRET = 'Local Appsemble development AES secret';
const NEW_AES_SECRET = 'new-test-aes-secret-key-12345678';

describe('reencryptSecrets', () => {
  beforeEach(async () => {
    await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
  });

  it('should re-encrypt app dbPassword with the new AES secret', async () => {
    const app = await App.create({
      OrganizationId: 'testorganization',
      definition: { name: 'Test App', defaultPage: 'Test' },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
    });

    const originalDbPassword = decrypt(app.dbPassword, OLD_AES_SECRET);

    const result = await reencryptSecrets({
      oldAesSecret: OLD_AES_SECRET,
      newAesSecret: NEW_AES_SECRET,
      batch: 10,
    });

    expect(result.totalApps).toBe(1);
    expect(result.processedApps).toBe(1);
    expect(result.reencryptedAppSecrets).toBe(1);

    await app.reload();

    expect(decrypt(app.dbPassword, NEW_AES_SECRET)).toBe(originalDbPassword);
  });

  it('should re-encrypt emailPassword with the new AES secret', async () => {
    const originalEmailPassword = 'test-email-password';

    const app = await App.create({
      OrganizationId: 'testorganization',
      definition: { name: 'Test App', defaultPage: 'Test' },
      path: 'test-app-email',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      emailPassword: encrypt(originalEmailPassword, OLD_AES_SECRET),
    });

    const result = await reencryptSecrets({
      oldAesSecret: OLD_AES_SECRET,
      newAesSecret: NEW_AES_SECRET,
      batch: 10,
    });

    expect(result.reencryptedAppSecrets).toBe(2);

    await app.reload();

    expect(decrypt(app.emailPassword!, NEW_AES_SECRET)).toBe(originalEmailPassword);
  });

  it('should re-encrypt scimToken and stripe secrets', async () => {
    const originalScimToken = 'test-scim-token';
    const originalStripeApiKey = 'sk_test_123456';
    const originalStripeWebhookSecret = 'test_token_123456';

    const app = await App.create({
      OrganizationId: 'testorganization',
      definition: { name: 'Test App', defaultPage: 'Test' },
      path: 'test-app-2',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      scimToken: encrypt(originalScimToken, OLD_AES_SECRET),
      stripeApiSecretKey: encrypt(originalStripeApiKey, OLD_AES_SECRET),
      stripeWebhookSecret: encrypt(originalStripeWebhookSecret, OLD_AES_SECRET),
    });

    const result = await reencryptSecrets({
      oldAesSecret: OLD_AES_SECRET,
      newAesSecret: NEW_AES_SECRET,
    });

    expect(result.reencryptedAppSecrets).toBe(4);

    await app.reload();

    expect(decrypt(app.scimToken!, NEW_AES_SECRET)).toBe(originalScimToken);
    expect(decrypt(app.stripeApiSecretKey!, NEW_AES_SECRET)).toBe(originalStripeApiKey);
    expect(decrypt(app.stripeWebhookSecret!, NEW_AES_SECRET)).toBe(originalStripeWebhookSecret);
  });

  it('should re-encrypt AppServiceSecret secrets', async () => {
    const originalSecret = 'test-service-secret';
    const originalAccessToken = 'test-access-token';

    const app = await App.create({
      OrganizationId: 'testorganization',
      definition: { name: 'Test App', defaultPage: 'Test' },
      path: 'test-app-3',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
    });

    const { AppServiceSecret } = await getAppDB(app.id);

    await AppServiceSecret.create({
      urlPatterns: 'https://example.com/*',
      authenticationMethod: 'http-basic',
      identifier: 'test-user',
      secret: encrypt(originalSecret, OLD_AES_SECRET),
      accessToken: encrypt(originalAccessToken, OLD_AES_SECRET),
    });

    const result = await reencryptSecrets({
      oldAesSecret: OLD_AES_SECRET,
      newAesSecret: NEW_AES_SECRET,
    });

    expect(result.reencryptedServiceSecrets).toBe(2);

    const { AppServiceSecret: AppServiceSecretNew } = await getAppDB(
      app.id,
      undefined,
      undefined,
      true,
      NEW_AES_SECRET,
    );

    const serviceSecret = await AppServiceSecretNew.findOne();
    expect(decrypt(serviceSecret!.secret!, NEW_AES_SECRET)).toBe(originalSecret);
    expect(decrypt(serviceSecret!.accessToken!, NEW_AES_SECRET)).toBe(originalAccessToken);
  });

  it('should re-encrypt AppWebhookSecret secrets', async () => {
    const originalSecret = 'test-webhook-secret';

    const app = await App.create({
      OrganizationId: 'testorganization',
      definition: { name: 'Test App', defaultPage: 'Test' },
      path: 'test-app-4',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
    });

    const { AppWebhookSecret } = await getAppDB(app.id);

    await AppWebhookSecret.create({
      webhookName: 'test-webhook',
      secret: encrypt(originalSecret, OLD_AES_SECRET),
    });

    const result = await reencryptSecrets({
      oldAesSecret: OLD_AES_SECRET,
      newAesSecret: NEW_AES_SECRET,
    });

    expect(result.reencryptedWebhookSecrets).toBe(1);

    const { AppWebhookSecret: AppWebhookSecretNew } = await getAppDB(
      app.id,
      undefined,
      undefined,
      true,
      NEW_AES_SECRET,
    );

    const webhookSecret = await AppWebhookSecretNew.findOne();
    expect(decrypt(webhookSecret!.secret, NEW_AES_SECRET)).toBe(originalSecret);
  });

  it('should skip secrets that cannot be decrypted', async () => {
    const app = await App.create({
      OrganizationId: 'testorganization',
      definition: { name: 'Test App', defaultPage: 'Test' },
      path: 'test-app-5',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      // This is encrypted with a different key, so it should fail decryption
      emailPassword: encrypt('test-password', 'wrong-key-that-wont-match'),
    });

    const originalEmailPassword = app.emailPassword;

    const result = await reencryptSecrets({
      oldAesSecret: OLD_AES_SECRET,
      newAesSecret: NEW_AES_SECRET,
    });

    expect(result.reencryptedAppSecrets).toBe(1);
    expect(result.skippedSecrets).toBe(1);

    await app.reload();

    expect(app.emailPassword).toStrictEqual(originalEmailPassword);
  });

  it('should process apps in batches', async () => {
    for (let i = 0; i < 5; i += 1) {
      await App.create({
        OrganizationId: 'testorganization',
        definition: { name: `Test App ${i}`, defaultPage: 'Test' },
        path: `test-app-batch-${i}`,
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        emailPassword: encrypt(`password-${i}`, OLD_AES_SECRET),
      });
    }

    const result = await reencryptSecrets({
      oldAesSecret: OLD_AES_SECRET,
      newAesSecret: NEW_AES_SECRET,
      batch: 2,
    });

    expect(result.totalApps).toBe(5);
    expect(result.processedApps).toBe(5);
    // 5 apps * 2 secrets each (dbPassword + emailPassword)
    expect(result.reencryptedAppSecrets).toBe(10);
  });

  it('should handle apps with only dbPassword encrypted', async () => {
    await App.create({
      OrganizationId: 'testorganization',
      definition: { name: 'Test App', defaultPage: 'Test' },
      path: 'test-app-no-secrets',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
    });

    const result = await reencryptSecrets({
      oldAesSecret: OLD_AES_SECRET,
      newAesSecret: NEW_AES_SECRET,
    });

    expect(result.totalApps).toBe(1);
    expect(result.processedApps).toBe(1);
    // Only dbPassword is encrypted (auto-created by App.beforeCreateHook)
    expect(result.reencryptedAppSecrets).toBe(1);
    expect(result.skippedSecrets).toBe(0);
  });

  it('should return zero counts when no apps exist', async () => {
    const result = await reencryptSecrets({
      oldAesSecret: OLD_AES_SECRET,
      newAesSecret: NEW_AES_SECRET,
    });

    expect(result.totalApps).toBe(0);
    expect(result.processedApps).toBe(0);
    expect(result.reencryptedAppSecrets).toBe(0);
    expect(result.reencryptedServiceSecrets).toBe(0);
    expect(result.reencryptedWebhookSecrets).toBe(0);
    expect(result.skippedSecrets).toBe(0);
  });
});
