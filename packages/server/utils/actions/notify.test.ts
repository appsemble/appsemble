import { type NotifyActionDefinition } from '@appsemble/lang-sdk';
import webpush from 'web-push';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { notify } from './notify.js';
import { App, getAppDB, Organization } from '../../models/index.js';
import { options } from '../../options/options.js';
import { handleAction } from '../action.js';
import { argv, setArgv } from '../argv.js';
import { Mailer } from '../email/Mailer.js';

const originalSendNotification = webpush.sendNotification;
let pushedEndpoints: string[];
let app: App;
let managerId: string;

async function runNotify(to: string): Promise<void> {
  await handleAction(notify as never, {
    app,
    action: { type: 'notify', to, title: 'Title', body: 'Body' } as NotifyActionDefinition,
    mailer: new Mailer(argv),
    data: {},
    options,
    context: {} as any,
  });
}

describe('notify', () => {
  beforeEach(async () => {
    setArgv({ host: 'https://example.com' });
    pushedEndpoints = [];
    webpush.sendNotification = (subscription) => {
      pushedEndpoints.push(subscription.endpoint);
      return Promise.resolve({ statusCode: 201, body: '', headers: {} });
    };

    const organization = await Organization.create({ id: 'testorganization' });
    app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          default: { role: 'Staff', policy: 'everyone' },
          roles: { Staff: {}, Manager: {} },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const { AppMember, AppSubscription } = await getAppDB(app.id);
    const manager = await AppMember.create({
      email: 'manager@example.com',
      role: 'Manager',
      AppId: app.id,
    });
    const staff = await AppMember.create({
      email: 'staff@example.com',
      role: 'Staff',
      AppId: app.id,
    });
    managerId = manager.id;
    await AppSubscription.create({
      endpoint: 'https://push.example/manager',
      p256dh: 'p256dh',
      auth: 'auth',
      AppMemberId: manager.id,
    });
    await AppSubscription.create({
      endpoint: 'https://push.example/staff',
      p256dh: 'p256dh',
      auth: 'auth',
      AppMemberId: staff.id,
    });
  });

  afterEach(() => {
    webpush.sendNotification = originalSendNotification;
  });

  it('should notify the members of a role', async () => {
    await runNotify('Manager');

    expect(pushedEndpoints).toStrictEqual(['https://push.example/manager']);
  });

  it('should notify a single member by id', async () => {
    await runNotify(managerId);

    expect(pushedEndpoints).toStrictEqual(['https://push.example/manager']);
  });

  it('should notify all subscribed members', async () => {
    await runNotify('all');

    expect(pushedEndpoints.toSorted()).toStrictEqual([
      'https://push.example/manager',
      'https://push.example/staff',
    ]);
  });
});
