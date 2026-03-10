import { beforeEach, describe, expect, it } from 'vitest';

import { App, getAppDB, Organization } from '../index.js';

describe('AppMember', () => {
  beforeEach(async () => {
    await Organization.create({
      name: 'Test Organization',
      id: 'testorganization',
    });
    await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Admin',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
            Admin: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: 'testorganization',
    });
  });

  it('should throw if the phone number is not valid', async () => {
    const { AppMember } = await getAppDB(1);
    await expect(
      AppMember.create({
        email: 'test@example.com',
        role: 'Admin',
        phoneNumber: '+31 6 1234 567',
      }),
    ).rejects.toThrowError('Invalid Phone Number');
  });

  it('should use NL as default country code', async () => {
    const { AppMember } = await getAppDB(1);
    const member = await AppMember.create({
      email: 'test@example.com',
      role: 'Admin',
      phoneNumber: '06 1234 5678',
    });
    expect(member.phoneNumber).toBe('+31 6 12345678');
  });
});
