import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  getDB,
  Organization,
  OrganizationMember,
  OrganizationSso,
  OrganizationSsoDomain,
  User,
} from '../models/index.js';
import { decrypt } from '../utils/crypto.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';

let directory: string;
let configurationPath: string;
let clientSecretFile: string;

async function configure(configuration: Record<string, unknown>): Promise<void> {
  await writeFile(configurationPath, JSON.stringify(configuration));
  await promisify(execFile)(
    process.execPath,
    [
      '--import',
      'tsx',
      'packages/server/bin.ts',
      'configure-organization-sso',
      '--config',
      configurationPath,
    ],
    {
      env: {
        ...process.env,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        NODE_ENV: 'test',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        AES_SECRET: 'organization-sso-test-key',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        DATABASE_HOST: process.env.DATABASE_HOST || 'localhost',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        DATABASE_PORT: process.env.DATABASE_PORT || '54321',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        DATABASE_USER: process.env.DATABASE_USER || 'admin',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || 'password',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        DATABASE_NAME: getDB().getDatabaseName(),
      },
    },
  );
}

describe('deployment-managed organization single sign-on', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    await setTestApp(await createServer());
  });

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'appsemble-organization-sso-'));
    configurationPath = join(directory, 'configuration.yaml');
    clientSecretFile = join(directory, 'client-secret');
    await writeFile(clientSecretFile, 'provider-client-secret');
    await Organization.create({ id: 'staff', name: 'Staff workspace' });
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('applies declared SSO settings without resetting organization details', async () => {
    await configure({
      staff: {
        issuer: 'https://identity.example.com/realms/staff',
        clientId: 'appsemble-studio',
        clientSecretFile,
        name: 'Staff sign-in',
        policy: 'required',
        roleMappings: [{ group: '/staff/owners', role: PredefinedOrganizationRole.Owner }],
      },
    });

    const sso = await OrganizationSso.findByPk('staff');
    expect({
      managedBy: sso?.managedBy,
      policy: sso?.policy,
      roleMappings: sso?.roleMappings,
      organizationName: (await Organization.findByPk('staff'))?.name,
    }).toStrictEqual({
      managedBy: 'deployment',
      policy: 'required',
      roleMappings: [{ group: '/staff/owners', role: PredefinedOrganizationRole.Owner }],
      organizationName: 'Staff workspace',
    });
  });

  it('ignores the trailing newline of a client secret file', async () => {
    await writeFile(clientSecretFile, 'provider-client-secret\n');
    await configure({
      staff: {
        issuer: 'https://identity.example.com/realms/staff',
        clientId: 'appsemble-studio',
        clientSecretFile,
        name: 'Staff sign-in',
        policy: 'required',
        roleMappings: [],
      },
    });

    const sso = await OrganizationSso.findByPk('staff');
    expect(decrypt(sso!.clientSecret, 'organization-sso-test-key')).toBe('provider-client-secret');
  });

  it('routes trusted domains and aliases without DNS proof and removes undeclared domains', async () => {
    const configuration = {
      issuer: 'https://identity.example.com/realms/staff',
      clientId: 'appsemble-studio',
      clientSecretFile,
      name: 'Staff sign-in',
      policy: 'required',
      roleMappings: [],
    };
    await configure({
      staff: { ...configuration, domains: ['STAFF.example.com', 'alias.example.com'] },
    });
    const result = {
      organizations: [{ id: 'staff', name: 'Staff workspace', ssoName: 'Staff sign-in' }],
    };
    for (const domain of ['staff.example.com', 'alias.example.com']) {
      const { data } = await request.post('/api/auth/email/discover', { email: `user@${domain}` });
      expect(data).toStrictEqual(result);
    }

    await OrganizationSsoDomain.update(
      { managedBy: 'studio', token: 'previous-owner-proof' },
      { where: { OrganizationId: 'staff', domain: 'staff.example.com' } },
    );

    await configure({ staff: { ...configuration, domains: ['alias.example.com'] } });
    const { data } = await request.post('/api/auth/email/discover', {
      email: 'user@staff.example.com',
    });
    expect(data).toStrictEqual({ organizations: [] });

    await configure({});
    const removed = await request.post('/api/auth/email/discover', {
      email: 'user@alias.example.com',
    });
    expect(removed.data).toStrictEqual({ organizations: [] });
  });

  it('rejects domains which cannot identify an exact email domain', async () => {
    await expect(
      configure({
        staff: {
          issuer: 'https://identity.example.com/realms/staff',
          clientId: 'appsemble-studio',
          clientSecretFile,
          name: 'Staff sign-in',
          policy: 'required',
          roleMappings: [],
          domains: ['*.example.com'],
        },
      }),
    ).rejects.toMatchObject({ code: 1 });
    expect(await OrganizationSso.count()).toBe(0);
  });

  it.each([
    ['a plain HTTP issuer', { issuer: 'http://identity.example.com/realms/staff' }],
    ['a scope without openid', { scope: 'email profile' }],
  ])('rejects a declaration with %s', async (description, override) => {
    await expect(
      configure({
        staff: {
          issuer: 'https://identity.example.com/realms/staff',
          clientId: 'appsemble-studio',
          clientSecretFile,
          name: 'Staff sign-in',
          policy: 'required',
          roleMappings: [],
          ...override,
        },
      }),
    ).rejects.toMatchObject({ code: 1 });
    expect(await OrganizationSso.count()).toBe(0);
  });

  it('rolls back the declaration when another organization does not exist', async () => {
    const configuration = {
      issuer: 'https://identity.example.com/realms/staff',
      clientId: 'appsemble-studio',
      clientSecretFile,
      name: 'Staff sign-in',
      policy: 'required',
      roleMappings: [],
    };

    await expect(configure({ staff: configuration, missing: configuration })).rejects.toMatchObject(
      {
        code: 1,
      },
    );
    expect(await OrganizationSso.count()).toBe(0);
  });

  it('revokes removed deployment grants and preserves Studio-managed configuration', async () => {
    const configuration = {
      issuer: 'https://identity.example.com/realms/staff',
      clientId: 'appsemble-studio',
      clientSecretFile,
      name: 'Staff sign-in',
      policy: 'required',
      roleMappings: [],
    };
    await Organization.create({ id: 'customer' });
    await configure({ staff: configuration, customer: configuration });
    await OrganizationSso.update(
      { managedBy: 'studio' },
      { where: { OrganizationId: 'customer' } },
    );
    const members = [
      { name: 'Staff member', role: null, guest: false },
      { name: 'Manual member', role: PredefinedOrganizationRole.Member, guest: false },
      { name: 'Guest member', role: PredefinedOrganizationRole.Member, guest: true },
    ];
    for (const { guest, name, role } of members) {
      const user = await User.create({ name, timezone: 'Europe/Amsterdam' });
      await OrganizationMember.create({
        OrganizationId: 'staff',
        UserId: user.id,
        role,
        guest,
        ssoRoles: role ? [] : [PredefinedOrganizationRole.Maintainer],
      });
    }

    await configure({});

    const remaining = await OrganizationMember.findAll({
      where: { OrganizationId: 'staff' },
      include: [User],
    });
    expect({
      staff: Boolean(await OrganizationSso.findByPk('staff')),
      customer: Boolean(await OrganizationSso.findByPk('customer')),
      members: remaining.map(({ User: user }) => user!.name).sort(),
    }).toStrictEqual({
      staff: false,
      customer: true,
      members: ['Guest member', 'Manual member'],
    });
  });
});
