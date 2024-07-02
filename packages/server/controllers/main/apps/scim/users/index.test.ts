import { TeamRole } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, expect, it, vi } from 'vitest';

import { setArgv } from '../../../../../index.js';
import {
  App,
  AppMember,
  Organization,
  Team,
  TeamMember,
  User,
} from '../../../../../models/index.js';
import { argv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { encrypt } from '../../../../../utils/crypto.js';
import { authorizeScim } from '../../../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../../../utils/test/testSchema.js';

let app: App;

useTestDatabase(import.meta);
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

it("should create a team if the user contains a manager ID of a team that doesn't exist yet", async () => {
  const user = await User.create({ timezone: 'Europe/Amsterdam' });
  const member = await AppMember.create({
    email: 'user@example.com',
    AppId: app.id,
    UserId: user.id,
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

  const team = await Team.findOne({ where: { AppId: app.id, name: 'krbs' } });

  expect(team).toMatchObject({
    AppId: 1,
    annotations: null,
    id: 1,
    name: 'krbs',
  });
});

it('should add member to an existing team if the user contains a manager ID of a team that already exists', async () => {
  const user1 = await User.create({ timezone: 'Europe/Amsterdam' });
  const user2 = await User.create({ timezone: 'Europe/Amsterdam' });
  const member1 = await AppMember.create({
    email: 'user1@example.com',
    AppId: app.id,
    UserId: user1.id,
    role: 'User',
  });
  const member2 = await AppMember.create({
    email: 'user2@example.com',
    AppId: app.id,
    UserId: user2.id,
    role: 'User',
  });
  const team = await Team.create({ AppId: app.id, name: member1.id });
  await TeamMember.create({ TeamId: team.id, AppMemberId: member1.id, role: 'manager' });

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

  const result = await TeamMember.findOne({
    where: { TeamId: team.id, AppMemberId: member2.id },
  });

  expect(result).toMatchObject({
    AppMemberId: member2.id,
    TeamId: 1,
    role: TeamRole.Member,
  });
});

it('should assign existing manager to new team as manager', async () => {
  const user1 = await User.create({ timezone: 'Europe/Amsterdam' });
  const user2 = await User.create({ timezone: 'Europe/Amsterdam' });
  const member1 = await AppMember.create({
    email: 'user1@example.com',
    AppId: app.id,
    UserId: user1.id,
    role: 'User',
  });
  const member2 = await AppMember.create({
    email: 'user2@example.com',
    AppId: app.id,
    UserId: user2.id,
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

  const result = await TeamMember.findOne({
    where: { AppMemberId: member2.id },
    include: [{ model: Team, where: { AppId: app.id } }],
  });

  expect(result).toMatchObject({
    AppMemberId: member2.id,
    TeamId: 1,
    role: TeamRole.Manager,
  });
}, 50_000);
