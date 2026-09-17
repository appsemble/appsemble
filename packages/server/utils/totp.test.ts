import { PredefinedOrganizationRole } from '@appsemble/types';
import { type Context } from 'koa';
import { authenticator } from 'otplib';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setArgv } from './argv.js';
import { encrypt } from './crypto.js';
import { createTestAppMember, createTestUser } from './test/authorization.js';
import { assertTotpToken } from './totp.js';
import {
  App,
  type AppMember as AppMemberType,
  getAppDB,
  Organization,
  OrganizationMember,
} from '../models/index.js';

let app: App;
let secret: string;
let appMember: AppMemberType;

/**
 * A minimal stand in for a Koa context, which is all `throwKoaError` touches.
 *
 * @returns A context which throws the error `throwKoaError` writes to it.
 */
function createContext(): Context {
  const ctx = {
    response: {} as Context['response'],
    throw() {
      throw new Error((ctx.response.body as { message: string }).message);
    },
  };
  return ctx as unknown as Context;
}

beforeEach(async () => {
  setArgv({ host: 'http://localhost', secret: 'test', aesSecret: 'test' });
  const user = await createTestUser();
  const organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  await OrganizationMember.create({
    OrganizationId: organization.id,
    UserId: user.id,
    role: PredefinedOrganizationRole.Owner,
  });
  app = await App.create({
    definition: { name: 'Test App', defaultPage: 'Test Page' },
    path: 'test-app',
    vapidPublicKey: 'a',
    vapidPrivateKey: 'b',
    OrganizationId: organization.id,
    totp: 'enabled',
  });
  secret = authenticator.generateSecret();
  appMember = await createTestAppMember(app.id);
  await appMember.update({ totpEnabled: true, totpSecret: encrypt(secret, 'test') });
});

describe('assertTotpToken', () => {
  it('should resolve the counter against a single epoch', async () => {
    const { AppMember } = await getAppDB(app.id);
    // A code for the step starting at 0, generated just before the step boundary.
    const token = authenticator.clone({ epoch: 29_999 }).generate(secret);

    // The clock ticks over the boundary between the two reads a naive implementation does: one for
    // its own counter arithmetic, and one inside otplib. Both have to land on the same counter, or
    // the code below can be replayed.
    const member = (await AppMember.findByPk(appMember.id))!;
    const clock = vi.spyOn(Date, 'now').mockReturnValueOnce(29_999).mockReturnValue(30_001);

    await assertTotpToken(createContext(), member, token, 401);

    clock.mockRestore();
    expect((await AppMember.findByPk(appMember.id))?.totpLastCounter).toBe(0);

    const replayMember = (await AppMember.findByPk(appMember.id))!;
    vi.spyOn(Date, 'now').mockReturnValue(30_001);
    await expect(assertTotpToken(createContext(), replayMember, token, 401)).rejects.toThrow(
      'Invalid TOTP token',
    );
    vi.restoreAllMocks();
    expect((await AppMember.findByPk(appMember.id))?.totpLastCounter).toBe(0);
  });

  it('should register the lockout in the same statement as the failed attempt', async () => {
    const { AppMember } = await getAppDB(app.id);
    const now = Date.UTC(2000, 0, 1);
    vi.spyOn(Date, 'now').mockReturnValue(now);

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      await expect(
        assertTotpToken(createContext(), (await AppMember.findByPk(appMember.id))!, '000000', 401),
      ).rejects.toThrow('Invalid TOTP token');

      const updated = await AppMember.findByPk(appMember.id);
      expect(updated?.totpFailedAttempts).toBe(attempt);
      expect(updated?.totpLockedUntil).toStrictEqual(
        attempt < 5 ? null : new Date(now + 15 * 60 * 1000),
      );
    }
  });
});
