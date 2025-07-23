import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { setArgv } from '../../../../../index.js';
import { App, getAppDB, Organization, User } from '../../../../../models/index.js';
import { argv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { encrypt } from '../../../../../utils/crypto.js';
import { authorizeScim } from '../../../../../utils/test/authorization.js';

let app: App;

describe('scim users', () => {
  vi.useFakeTimers().setSystemTime(new Date('2000-01-01'));

  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test', aesSecret: 'test' });
    const server = await createServer();
    request.defaults.headers['content-type'] = 'application/scim+json';
    await setTestApp(server);
  });

  beforeEach(async () => {
    const organization = await Organization.create({ id: 'testorganization' });
    const scimToken = 'test';
    app = await App.create({
      definition: {
        security: {
          default: {
            role: 'User',
            policy: 'everyone',
          },
          roles: {
            User: { description: 'Default SCIM User for testing.' },
          },
        },
      },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      scimEnabled: true,
      scimToken: encrypt(scimToken, argv.aesSecret),
    });
    authorizeScim(scimToken);
  });

  it.todo(
    "should create a group if the user contains a manager ID of a group that doesn't exist yet",
    async () => {
      const user = await User.create({ timezone: 'Europe/Amsterdam' });
      const { AppMember, Group } = await getAppDB(app.id);
      const member = await AppMember.create({
        email: 'user@example.com',
        userId: user.id,
        role: 'User',
      });

      await request.patch(`/api/apps/${app.id}/scim/Users/${member.id}`, {
        ScHeMaS: [
          'urn:ietf:params:scim:schemas:core:2.0:User',
          'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
        ],
        oPeRaTiOnS: [
          {
            op: 'add',
            path: 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:user:manager',
            value: 'krbs',
          },
        ],
      });

      const group = await Group.findOne({ where: { name: 'krbs' } });

      expect(group).toMatchObject({
        AppId: 1,
        annotations: null,
        id: 1,
        name: 'krbs',
      });
    },
  );

  it.todo(
    'should add member to an existing group if the user contains a manager ID of a group that already exists',
    async () => {
      const user1 = await User.create({ timezone: 'Europe/Amsterdam' });
      const user2 = await User.create({ timezone: 'Europe/Amsterdam' });
      const { AppMember, Group, GroupMember } = await getAppDB(app.id);
      const member1 = await AppMember.create({
        email: 'user1@example.com',
        userId: user1.id,
        role: 'User',
      });
      const member2 = await AppMember.create({
        email: 'user2@example.com',
        userId: user2.id,
        role: 'User',
      });
      const group = await Group.create({ AppId: app.id, name: member1.id });
      await GroupMember.create({ GroupId: group.id, AppMemberId: member1.id, role: 'manager' });

      await request.patch(`/api/apps/${app.id}/scim/Users/${member2.id}`, {
        ScHeMaS: [
          'urn:ietf:params:scim:schemas:core:2.0:User',
          'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
        ],
        oPeRaTiOnS: [
          {
            op: 'add',
            path: 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:user:manager',
            value: member1.id,
          },
        ],
      });

      const result = await GroupMember.findOne({
        where: { GroupId: group.id, AppMemberId: member2.id },
      });

      expect(result).toMatchObject({
        AppMemberId: member2.id,
        GroupId: 1,
        role: 'Member',
      });
    },
  );

  it.todo(
    'should assign existing manager to new group as manager',
    async () => {
      const user1 = await User.create({ timezone: 'Europe/Amsterdam' });
      const user2 = await User.create({ timezone: 'Europe/Amsterdam' });
      const { AppMember, Group, GroupMember } = await getAppDB(app.id);
      const member1 = await AppMember.create({
        email: 'user1@example.com',
        userId: user1.id,
        role: 'User',
      });
      const member2 = await AppMember.create({
        email: 'user2@example.com',
        userId: user2.id,
        role: 'User',
      });

      await request.patch(`/api/apps/${app.id}/scim/Users/${member1.id}`, {
        ScHeMaS: [
          'urn:ietf:params:scim:schemas:core:2.0:User',
          'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
        ],
        oPeRaTiOnS: [
          {
            op: 'add',
            path: 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:user:manager',
            value: member2.id,
          },
        ],
      });

      const result = await GroupMember.findOne({
        where: { AppMemberId: member2.id },
        include: [{ model: Group, where: { AppId: app.id } }],
      });

      expect(result).toMatchObject({
        AppMemberId: member2.id,
        GroupId: 1,
        role: 'GroupMembersManager',
      });
    },
    50_000,
  );
});
