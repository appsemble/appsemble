import { beforeEach } from 'node:test';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { appMemberQuery } from './appMember.js';
import { App, AppMember, Organization } from '../../models/index.js';

describe('appMemberQuery', () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllTimers();
    vi.setSystemTime(0);
  });

  it('should allow filtering using oData filters', async () => {
    const organization = await Organization.create({
      name: 'Test Organization',
      id: 'testorganization',
    });

    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Staff',
            policy: 'everyone',
          },
          roles: {
            Staff: {},
            Manager: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    [...Array.from({ length: 5 }).keys()].map(async (item) => {
      await AppMember.create({
        name: `Bot ${item}`,
        email: `test${item}@example.com`,
        role: 'Staff',
        emailVerified: true,
        AppId: app.id,
        properties: {
          foo: `Bar ${item}`,
        },
      });
    });

    await AppMember.create({
      name: 'Bot 22',
      email: 'test22@example.com',
      role: 'Manager',
      emailVerified: true,
      AppId: app.id,
      properties: {
        foo: 'Bar 2',
      },
    });

    const members = await appMemberQuery({
      action: {
        type: 'app.member.query',
        query: { 'object.from': { $filter: "foo eq 'Bar 2'" } },
      },
      app,
      data: {},
      internalContext: {} as any,
      context: {} as any,
      mailer: {} as any,
      options: {} as any,
    });

    expect(members).toStrictEqual([
      {
        sub: expect.any(String),
        name: 'Bot 2',
        email: 'test2@example.com',
        email_verified: true,
        picture: expect.stringContaining('https://www.gravatar.com/avatar/'),
        locale: null,
        zoneinfo: null,
        properties: { foo: 'Bar 2' },
        role: 'Staff',
        demo: false,
      },
      {
        sub: expect.any(String),
        name: 'Bot 22',
        email: 'test22@example.com',
        email_verified: true,
        picture: expect.stringContaining('https://www.gravatar.com/avatar/'),
        locale: null,
        zoneinfo: null,
        properties: { foo: 'Bar 2' },
        role: 'Manager',
        demo: false,
      },
    ]);
  });
});
