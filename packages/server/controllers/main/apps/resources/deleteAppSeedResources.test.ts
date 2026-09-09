import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import webpush from 'web-push';

import {
  type App,
  getAppDB,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { syncResourceUniqueIndexes } from '../../../../utils/resourceUniqueIndexes.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';
import { exampleApp } from '../../../../utils/test/exampleApp.js';

let organization: Organization;
let user: User;
let app: App;
let originalSendNotification: typeof webpush.sendNotification;

describe('deleteAppSeedResources', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
    originalSendNotification = webpush.sendNotification;
  });

  beforeEach(async () => {
    // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
    vi.clearAllTimers();
    vi.setSystemTime(0);
    user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      UserId: user.id,
      OrganizationId: organization.id,
      role: 'Maintainer',
    });
    app = await exampleApp(organization.id);
  });

  afterAll(() => {
    webpush.sendNotification = originalSendNotification;
    vi.useRealTimers();
  });

  it.each(['delete', 'put'])('requires authentication for seed %s', async (method) => {
    const response = await request({ method, url: `/api/apps/${app.id}/resources`, data: {} });
    expect(response.status).toBe(401);
  });

  it('should delete seed resources in all apps', async () => {
    authorizeStudio();

    const { Resource } = await getAppDB(app.id);
    await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
      seed: true,
    });

    await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
      seed: true,
    });

    await request.delete(`/api/apps/${app.id}/resources`);

    const seedResources = await Resource.findAll({
      where: {
        seed: true,
      },
    });

    expect(seedResources).toStrictEqual([]);
  });

  it('allows concurrent seed deletion without failing after partial deletion', async () => {
    authorizeStudio();
    const { Resource } = await getAppDB(app.id);
    await Resource.bulkCreate(
      Array.from({ length: 10 }, (unused, index) => ({
        type: 'testResource',
        data: { foo: `Product ${index}` },
        seed: true,
      })),
    );

    const responses = await Promise.all([
      request.delete(`/api/apps/${app.id}/resources`),
      request.delete(`/api/apps/${app.id}/resources`),
    ]);

    expect(responses.map(({ status }) => status)).toStrictEqual([204, 204]);
    expect(await Resource.count()).toBe(0);
  });

  it('preserves all resources when deletion is blocked by a persistent reference', async () => {
    authorizeStudio();
    const { Resource } = await getAppDB(app.id);
    const parent = await Resource.create({
      type: 'testResource',
      data: { foo: 'Product' },
      seed: true,
    });
    await Resource.create({ type: 'testResource', data: { foo: 'Other product' }, seed: true });
    await Resource.create({
      type: 'testResourceB',
      data: { bar: 'User progress', testResourceId: parent.id },
    });

    const response = await request.delete(`/api/apps/${app.id}/resources`);

    expect(response.status).toBe(400);
    expect(await Resource.count()).toBe(3);
    expect((await Resource.findByPk(parent.id))?.data).toStrictEqual({ foo: 'Product' });
  });

  it.each([
    { testResource: [{ foo: 42 }] },
    { testResourceB: [{ bar: 'Quiz', $testResource: 2 }], testResource: [{ foo: 'Product' }] },
    { testResourceB: [{ bar: 'Quiz', testResourceId: 999_999 }] },
  ])('preserves visible demo content when replacement validation fails: %j', async (batch) => {
    authorizeStudio();
    await app.update({ demoMode: true });
    const { Resource } = await getAppDB(app.id);
    await Resource.create({ type: 'testResource', data: { foo: 'Saved product' }, seed: true });
    await Resource.create({
      type: 'testResource',
      data: { foo: 'Visible product' },
      ephemeral: true,
    });

    const response = await request.put(`/api/apps/${app.id}/resources`, batch);

    expect(response.status).toBe(400);
    expect(
      (await Resource.findAll({ order: [['id', 'ASC']] })).map(({ data }) => data.foo),
    ).toStrictEqual(['Saved product', 'Visible product']);
  });

  it('rolls back deletion and earlier inserts when a later resource upload conflicts', async () => {
    authorizeStudio();
    const definition = structuredClone(app.definition);
    definition.resources!.testResourceB.unique = ['bar'];
    await app.update({ definition, demoMode: true });
    const { Resource, sequelize } = await getAppDB(app.id);
    await syncResourceUniqueIndexes(sequelize, undefined, definition.resources);
    const parent = await Resource.create({
      type: 'testResource',
      data: { foo: 'Saved product' },
      seed: true,
    });
    const visible = await Resource.create({
      type: 'testResource',
      data: { foo: 'Visible product' },
      ephemeral: true,
    });

    const response = await request.put(`/api/apps/${app.id}/resources`, {
      testResource: [{ foo: 'Replacement product' }],
      testResourceB: [{ bar: 'Duplicate' }, { bar: 'Duplicate' }],
    });

    expect(response.status).toBe(409);
    expect(await Resource.count()).toBe(2);
    expect((await Resource.findByPk(parent.id))?.data.foo).toBe('Saved product');
    expect((await Resource.findByPk(visible.id))?.data.foo).toBe('Visible product');
  });

  it('preserves member properties and cascading references when replacement fails', async () => {
    authorizeStudio();
    const definition = structuredClone(app.definition);
    definition.members = {
      properties: {
        favorites: {
          schema: { type: 'array', items: { type: 'integer' } },
          reference: { resource: 'testResource' },
        },
      },
    };
    definition.resources!.testResourceB.unique = ['bar'];
    await app.update({ definition, demoMode: true });
    const { AppMember, Resource, sequelize } = await getAppDB(app.id);
    await syncResourceUniqueIndexes(sequelize, undefined, definition.resources);
    const product = await Resource.create({
      type: 'testResource',
      data: { foo: 'Product' },
      ephemeral: true,
    });
    const cascading = await Resource.create({
      type: 'testResourceC',
      data: { bar: 'Saved choice', testResourceId: product.id },
    });
    const member = await AppMember.create({
      email: 'staff@example.com',
      properties: { favorites: [product.id] },
    });

    const response = await request.put(`/api/apps/${app.id}/resources`, {
      testResourceB: [{ bar: 'Duplicate' }, { bar: 'Duplicate' }],
    });

    expect(response.status).toBe(409);
    expect((await member.reload()).properties?.favorites).toStrictEqual([product.id]);
    expect((await cascading.reload()).data.testResourceId).toBe(product.id);
    expect((await Resource.findByPk(product.id))?.data.foo).toBe('Product');
  });

  it('clears only deleted member references and accepts unset optional properties', async () => {
    authorizeStudio();
    const definition = structuredClone(app.definition);
    definition.members = {
      properties: {
        label: { schema: { type: 'string' } },
        favorites: {
          schema: { type: 'array', items: { type: 'integer' } },
          reference: { resource: 'testResource' },
        },
        selected: { schema: { type: 'integer' }, reference: { resource: 'testResource' } },
      },
    };
    await app.update({ definition });
    const { AppMember, Resource } = await getAppDB(app.id);
    const deleted = await Resource.create({
      type: 'testResource',
      data: { foo: 'Demo product' },
      seed: true,
    });
    const kept = await Resource.create({ type: 'testResource', data: { foo: 'Saved product' } });
    const member = await AppMember.create({
      email: 'staff@example.com',
      properties: { label: 'Staff', favorites: [deleted.id, kept.id], selected: kept.id },
    });
    const newcomer = await AppMember.create({ email: 'new@example.com', properties: {} });
    const newcomerProperties = structuredClone(newcomer.properties);

    const response = await request.delete(`/api/apps/${app.id}/resources`);

    expect(response.status).toBe(204);
    expect((await member.reload()).properties).toStrictEqual({
      label: 'Staff',
      favorites: [kept.id],
      selected: kept.id,
    });
    expect((await newcomer.reload()).properties).toStrictEqual(newcomerProperties);
  });

  it('replaces a demo with usable references and leaves persistent resources intact', async () => {
    authorizeStudio();
    const definition = structuredClone(app.definition);
    definition.resources!.testResourceBB.schema.properties!.testResourceId = { type: 'integer' };
    definition.resources!.testResourceBB.references!.testResourceId = { resource: 'testResource' };
    await app.update({ demoMode: true, definition });
    const { Resource } = await getAppDB(app.id);
    const old = await Resource.create({
      type: 'testResource',
      data: { foo: 'Old product' },
      ephemeral: true,
    });
    const persistent = await Resource.create({
      type: 'testResource',
      data: { foo: 'User product' },
    });

    const response = await request.put(`/api/apps/${app.id}/resources`, {
      testResourceBB: [{ bar: 'Question', $testResourceB: 0, $testResource: 0 }],
      testResourceB: [{ bar: 'Training', $testResource: 0 }],
      testResource: [{ foo: 'Heineken' }],
    });

    expect(response.status).toBe(200);
    const {
      testResource: [productId],
      testResourceB: [trainingId],
      testResourceBB: [questionId],
    } = response.data;
    expect((await Resource.findByPk(productId))?.data.foo).toBe('Heineken');
    expect((await Resource.findByPk(trainingId))?.data.testResourceId).toBe(productId);
    expect((await Resource.findByPk(questionId))?.data.testResourceBId).toBe(trainingId);
    expect((await Resource.findByPk(questionId))?.data.testResourceId).toBe(productId);
    expect(await Resource.findByPk(old.id)).toBeNull();
    expect((await Resource.findByPk(persistent.id))?.data.foo).toBe('User product');
    expect(await Resource.count({ where: { seed: true } })).toBe(3);
    expect(await Resource.count({ where: { ephemeral: true } })).toBe(3);
  });

  it('preserves resources when an asset reference cannot be validated', async () => {
    authorizeStudio();
    const definition = structuredClone(app.definition);
    definition.resources!.testResource.schema.properties!.photo = {
      type: 'string',
      format: 'binary',
    };
    await app.update({ definition });
    const { Resource } = await getAppDB(app.id);
    const product = await Resource.create({
      type: 'testResource',
      data: { foo: 'Product' },
      seed: true,
    });

    const response = await request.put(`/api/apps/${app.id}/resources`, {
      testResource: [{ foo: 'Replacement', photo: 'missing-asset' }],
    });

    expect(response.status).toBe(400);
    expect((await Resource.findByPk(product.id))?.data.foo).toBe('Product');
    expect(await Resource.count()).toBe(1);
  });

  it.each(['id', 'name'])(
    'preserves the demo when replacement references a hidden asset by %s',
    async (reference) => {
      authorizeStudio();
      const definition = structuredClone(app.definition);
      definition.resources!.testResource.schema.properties!.photo = {
        type: 'string',
        format: 'binary',
      };
      await app.update({ definition, demoMode: true });
      const { Asset, Resource } = await getAppDB(app.id);
      const product = await Resource.create({
        type: 'testResource',
        data: { foo: 'Visible product' },
        ephemeral: true,
      });
      const asset = await Asset.create({ name: 'product-photo', seed: true });

      const response = await request.put(`/api/apps/${app.id}/resources`, {
        testResource: [{ foo: 'Replacement', photo: reference === 'id' ? asset.id : asset.name }],
      });

      expect(response.status).toBe(400);
      expect((await Resource.findByPk(product.id))?.data.foo).toBe('Visible product');
      expect(await Resource.count()).toBe(1);

      const visibleAsset = await Asset.create({ name: asset.name, ephemeral: true });
      const replacement = await request.put(`/api/apps/${app.id}/resources`, {
        testResource: [
          {
            foo: 'Replacement',
            photo: reference === 'id' ? visibleAsset.id : visibleAsset.name,
          },
        ],
      });

      expect(replacement.status).toBe(200);
      expect((await Resource.findByPk(replacement.data.testResource[0]))?.data.photo).toBe(
        reference === 'id' ? visibleAsset.id : visibleAsset.name,
      );
    },
  );

  it.each(['id', 'name'])(
    'rejects an asset %s whose owning demo resource will be deleted',
    async (reference) => {
      authorizeStudio();
      const definition = structuredClone(app.definition);
      definition.resources!.testResource.schema.properties!.photo = {
        type: 'string',
        format: 'binary',
      };
      await app.update({ definition, demoMode: true });
      const { Asset, Resource } = await getAppDB(app.id);
      const product = await Resource.create({
        type: 'testResource',
        data: { foo: 'Product' },
        ephemeral: true,
      });
      const asset = await Asset.create({
        name: 'product-photo',
        ResourceId: product.id,
        ResourceType: 'testResource',
        ephemeral: true,
      });

      const response = await request.put(`/api/apps/${app.id}/resources`, {
        testResource: [{ foo: 'Replacement', photo: reference === 'id' ? asset.id : asset.name }],
      });

      expect(response.status).toBe(400);
      expect((await Resource.findByPk(product.id))?.data.foo).toBe('Product');
      expect(await Asset.findByPk(asset.id)).not.toBeNull();
    },
  );

  it.each(['asset', 'resource'])('rejects a reference to a cascaded %s', async (reference) => {
    authorizeStudio();
    const definition = structuredClone(app.definition);
    definition.resources!.testResourceNone.schema.properties!.photo = {
      type: 'string',
      format: 'binary',
    };
    definition.resources!.testResourceNone.schema.properties!.choice = { type: 'integer' };
    definition.resources!.testResourceNone.references = {
      choice: { resource: 'testResourceD' },
    };
    await app.update({ definition });
    const { Asset, Resource } = await getAppDB(app.id);
    const product = await Resource.create({
      type: 'testResource',
      data: { foo: 'Product' },
      seed: true,
    });
    const choice = await Resource.create({
      type: 'testResourceD',
      data: { bar: 'Saved choice', testResourceId: product.id },
    });
    const asset = await Asset.create({
      name: 'choice-photo',
      ResourceId: choice.id,
      ResourceType: choice.type,
    });

    const response = await request.put(`/api/apps/${app.id}/resources`, {
      testResourceNone: [
        {
          bar: 'Replacement',
          ...(reference === 'asset' ? { photo: asset.id } : { choice: choice.id }),
        },
      ],
    });

    expect(response.status).toBe(400);
    expect((await Resource.findByPk(product.id))?.data.foo).toBe('Product');
    expect((await Resource.findByPk(choice.id))?.data.testResourceId).toBe(product.id);
    expect(await Asset.findByPk(asset.id)).not.toBeNull();
    expect(await Resource.count()).toBe(2);
  });

  it('serializes concurrent replacements without mixing their data', async () => {
    authorizeStudio();
    const responses = await Promise.all(
      ['First', 'Second'].map((name) =>
        request.put(`/api/apps/${app.id}/resources`, {
          testResource: [{ foo: `${name} product` }],
          testResourceB: [{ bar: `${name} quiz`, $testResource: 0 }],
        }),
      ),
    );

    expect(responses.map(({ status }) => status)).toStrictEqual([200, 200]);
    const { Resource } = await getAppDB(app.id);
    const product = await Resource.findOne({ where: { type: 'testResource' } });
    const quiz = await Resource.findOne({ where: { type: 'testResourceB' } });
    expect(await Resource.count()).toBe(2);
    expect(quiz?.data.testResourceId).toBe(product?.id);
    expect(quiz?.data.bar).toBe(product?.data.foo.replace('product', 'quiz'));
  });

  it('should delete seed resources and ephemeral resources in demo apps', async () => {
    await app.update({ demoMode: true });
    authorizeStudio();

    const { Resource } = await getAppDB(app.id);
    await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
      seed: true,
    });

    await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
      seed: true,
    });

    await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
      ephemeral: true,
    });

    await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
      ephemeral: true,
    });

    await request.delete(`/api/apps/${app.id}/resources`);

    const seedResources = await Resource.findAll({
      where: {
        seed: true,
      },
    });

    expect(seedResources).toStrictEqual([]);

    const ephemeralResources = await Resource.findAll({
      where: {
        ephemeral: true,
      },
    });

    expect(ephemeralResources).toStrictEqual([]);
  });

  it('should delete seed resources with references in all apps', async () => {
    authorizeStudio();

    const { Resource } = await getAppDB(app.id);
    const testResource = await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
      seed: true,
    });

    const testResourceB = await Resource.create({
      type: 'testResourceB',
      data: { foo: 'I am Foo.', testResourceId: testResource.id },
      seed: true,
    });

    await Resource.create({
      type: 'testResourceBB',
      data: { foo: 'I am Foo.', testResourceBId: testResourceB.id },
      seed: true,
    });

    await request.delete(`/api/apps/${app.id}/resources`);

    const seedResources = await Resource.findAll({
      where: {
        seed: true,
      },
    });

    expect(seedResources).toStrictEqual([]);
  });

  it('should delete seed resources and ephemeral resources with references in demo apps', async () => {
    await app.update({ demoMode: true });
    authorizeStudio();

    const { Resource } = await getAppDB(app.id);
    const seedTestResource = await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
      seed: true,
    });

    const seedTestResourceB = await Resource.create({
      type: 'testResourceB',
      data: { foo: 'I am Foo.', testResourceId: seedTestResource.id },
      seed: true,
    });

    await Resource.create({
      type: 'testResourceBB',
      data: { foo: 'I am Foo.', testResourceBId: seedTestResourceB.id },
      seed: true,
    });

    const ephemeralTestResource = await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
      ephemeral: true,
    });

    const ephemeralTestResourceB = await Resource.create({
      type: 'testResourceB',
      data: { foo: 'I am Foo.', testResourceId: ephemeralTestResource.id },
      seed: true,
    });

    await Resource.create({
      type: 'testResourceBB',
      data: { foo: 'I am Foo.', testResourceBId: ephemeralTestResourceB.id },
      seed: true,
    });

    await request.delete(`/api/apps/${app.id}/resources`);

    const seedResources = await Resource.findAll({
      where: {
        seed: true,
      },
    });

    expect(seedResources).toStrictEqual([]);

    const ephemeralResources = await Resource.findAll({
      where: {
        ephemeral: true,
      },
    });

    expect(ephemeralResources).toStrictEqual([]);
  });
});
