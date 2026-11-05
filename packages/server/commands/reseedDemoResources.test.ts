import { type AppDefinition, AppValidator, validateAppDefinition } from '@appsemble/lang-sdk';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { cleanupResourcesAndAssets } from './cleanupResourcesAndAssets.js';
import { App, getAppDB, Organization, OrganizationMember } from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../utils/test/authorization.js';

type Reset = (appId: number) => Promise<unknown>;

const integer = { type: 'integer' } as const;
const text = { type: 'string' } as const;

async function publishDemoApp(
  resources: AppDefinition['resources'],
  seeds: Record<string, Record<string, unknown>[]>,
): Promise<number> {
  const definition: AppDefinition = {
    name: 'Test App',
    defaultPage: 'Test Page',
    pages: [{ name: 'Test Page', blocks: [{ type: 'test', version: '0.0.0' }] }],
    resources,
  };
  expect(new AppValidator().validateApp(definition).errors).toStrictEqual([]);
  const block = { name: '@appsemble/test', version: '0.0.0', files: [], languages: null };
  expect((await validateAppDefinition(definition, () => [block])).errors).toStrictEqual([]);

  const { id } = await App.create({
    demoMode: true,
    definition,
    vapidPublicKey: 'a',
    vapidPrivateKey: 'b',
    OrganizationId: 'testorganization',
  });
  authorizeStudio();
  const { status } = await request.put(`/api/apps/${id}/resources`, seeds);
  expect(status).toBe(200);
  return id;
}

async function readEphemeral(appId: number, type: string): Promise<Record<string, any>[]> {
  // The nightly cleanup closes the app database, so open it again to read the result.
  const { Resource } = await getAppDB(appId, undefined, undefined, true);
  const resources = await Resource.findAll({
    where: { ephemeral: true, type },
    order: [['id', 'ASC']],
  });
  return resources.map(({ data, id }) => ({ ...data, id }));
}

describe.each<[string, Reset]>([
  ['the nightly cleanup', () => cleanupResourcesAndAssets()],
  [
    'the reseed endpoint',
    (appId) => {
      authorizeStudio();
      return request.post(`/api/apps/${appId}/reseed`);
    },
  ],
])('resetting a published demo app with %s', (name, reset) => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' });
    await setTestApp(await createServer());
  });

  beforeEach(async () => {
    const user = await createTestUser();
    await Organization.create({ id: 'testorganization', name: 'Test Organization' });
    await OrganizationMember.create({
      OrganizationId: 'testorganization',
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
  });

  it('points a seed reference at the new copy of the indexed resource', async () => {
    const appId = await publishDemoApp(
      {
        owner: {
          schema: { type: 'object', additionalProperties: false, properties: { name: text } },
        },
        pet: {
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: { name: text, ownerId: integer },
          },
          references: { ownerId: { resource: 'owner' } },
        },
      },
      {
        owner: [{ name: 'Steve' }, { name: 'Carol' }],
        pet: [
          { name: 'Sven', $owner: 0 },
          { name: 'Bella', $owner: 1 },
        ],
      },
    );
    const publishedOwners = await readEphemeral(appId, 'owner');

    await reset(appId);

    const owners = await readEphemeral(appId, 'owner');
    const pets = await readEphemeral(appId, 'pet');
    expect(owners.map((owner) => owner.name)).toStrictEqual(['Steve', 'Carol']);
    expect(owners.map((owner) => owner.id)).not.toStrictEqual(
      publishedOwners.map((owner) => owner.id),
    );
    expect(pets).toMatchObject([
      { name: 'Sven', ownerId: owners[0].id },
      { name: 'Bella', ownerId: owners[1].id },
    ]);
  });

  it('keeps every seed reference of a resource with two references', async () => {
    const appId = await publishDemoApp(
      {
        owner: {
          schema: { type: 'object', additionalProperties: false, properties: { name: text } },
        },
        vet: {
          schema: { type: 'object', additionalProperties: false, properties: { name: text } },
        },
        pet: {
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: { ownerId: integer, vetId: integer },
          },
          references: { ownerId: { resource: 'owner' }, vetId: { resource: 'vet' } },
        },
      },
      {
        owner: [{ name: 'Steve' }],
        vet: [{ name: 'Carol' }],
        pet: [{ $owner: 0, $vet: 0 }],
      },
    );
    const [published] = await readEphemeral(appId, 'pet');
    expect(published).toHaveProperty('ownerId');
    expect(published).toHaveProperty('vetId');

    await reset(appId);

    const [owner] = await readEphemeral(appId, 'owner');
    const [vet] = await readEphemeral(appId, 'vet');
    const [pet] = await readEphemeral(appId, 'pet');
    expect(pet).toMatchObject({ ownerId: owner.id, vetId: vet.id });
  });

  it('restores seeds whose optional reference targets a type without seeds', async () => {
    const appId = await publishDemoApp(
      {
        litter: {
          schema: { type: 'object', additionalProperties: false, properties: { name: text } },
        },
        reply: {
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: { body: text, litterId: integer },
          },
          references: { litterId: { resource: 'litter' } },
        },
        notice: {
          schema: { type: 'object', additionalProperties: false, properties: { body: text } },
        },
      },
      { reply: [{ body: 'Thanks' }], notice: [{ body: 'Welcome' }] },
    );
    expect(await readEphemeral(appId, 'reply')).toHaveLength(1);
    expect(await readEphemeral(appId, 'notice')).toHaveLength(1);

    await reset(appId);

    expect(await readEphemeral(appId, 'reply')).toMatchObject([{ body: 'Thanks' }]);
    expect(await readEphemeral(appId, 'notice')).toMatchObject([{ body: 'Welcome' }]);
  });
});
