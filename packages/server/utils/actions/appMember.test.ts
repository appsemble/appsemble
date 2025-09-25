import { beforeEach } from 'node:test';

import { type AppMemberInfo, type AppMemberQueryAction } from '@appsemble/lang-sdk';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { appMemberQuery } from './appMember.js';
import { App, getAppDB, Organization } from '../../models/index.js';
import { options } from '../../options/options.js';
import { handleAction } from '../action.js';
import { argv, setArgv } from '../argv.js';
import { Mailer } from '../email/Mailer.js';

let mailer: Mailer;

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

describe('appMemberQuery', () => {
  it('should allow filtering using oData filters', async () => {
    // Somehow doesn't work when put in beforeEach
    setArgv({ host: 'https://example.com' });
    mailer = new Mailer(argv);
    const organization = await Organization.create({
      name: 'Test Organization',
      id: 'testorganization',
    });
    const action = {
      type: 'app.member.query',
      query: { 'object.from': { $filter: "foo eq 'Bar 2'" } },
    } as AppMemberQueryAction;

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
        cron: {
          schedule: '* * * * *',
          action,
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const { AppMember } = await getAppDB(app.id);
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

    const members = await handleAction(appMemberQuery as never, {
      app,
      action,
      mailer,
      data: {},
      options,
      context: {} as any,
    });

    expect(members).toStrictEqual([
      {
        sub: expect.any(String),
        name: 'Bot 2',
        phoneNumber: null,
        email: 'test2@example.com',
        email_verified: true,
        picture: expect.stringContaining('https://www.gravatar.com/avatar/'),
        locale: null,
        zoneinfo: null,
        properties: { foo: 'Bar 2' },
        role: 'Staff',
        demo: false,
        $seed: false,
        $ephemeral: false,
        unverifiedEmail: undefined,
      },
      {
        sub: expect.any(String),
        name: 'Bot 22',
        phoneNumber: null,
        email: 'test22@example.com',
        email_verified: true,
        picture: expect.stringContaining('https://www.gravatar.com/avatar/'),
        locale: null,
        zoneinfo: null,
        properties: { foo: 'Bar 2' },
        role: 'Manager',
        demo: false,
        $seed: false,
        $ephemeral: false,
        unverifiedEmail: undefined,
      },
    ]);
  });

  it('should apply correct filters when no roles are defined.', async () => {
    // Somehow doesn't work when put in beforeEach
    setArgv({ host: 'https://example.com' });
    mailer = new Mailer(argv);
    const organization = await Organization.create({
      name: 'Test Organization',
      id: 'testorganization',
    });
    const action = {
      type: 'app.member.query',
      query: { 'object.from': { $filter: "foo eq 'Bar 2'" } },
    } as AppMemberQueryAction;

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
        cron: {
          schedule: '* * * * *',
          action,
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const { AppMember } = await getAppDB(app.id);
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

    const members = await handleAction(appMemberQuery as never, {
      app,
      action,
      mailer,
      data: ['random-text-here'],
      options,
      context: {} as any,
    });

    expect(members as AppMemberInfo[]).toStrictEqual(
      expect.arrayContaining([
        {
          sub: expect.any(String),
          name: 'Bot 2',
          phoneNumber: null,
          email: 'test2@example.com',
          email_verified: true,
          picture: expect.stringContaining('https://www.gravatar.com/avatar/'),
          locale: null,
          zoneinfo: null,
          properties: { foo: 'Bar 2' },
          role: 'Staff',
          demo: false,
          $seed: false,
          $ephemeral: false,
        },
        {
          sub: expect.any(String),
          name: 'Bot 22',
          phoneNumber: null,
          email: 'test22@example.com',
          email_verified: true,
          picture: expect.stringContaining('https://www.gravatar.com/avatar/'),
          locale: null,
          zoneinfo: null,
          properties: { foo: 'Bar 2' },
          role: 'Manager',
          demo: false,
          $seed: false,
          $ephemeral: false,
        },
      ]),
    );
  });
});
