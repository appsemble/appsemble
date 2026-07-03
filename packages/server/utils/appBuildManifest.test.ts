import { type AppDefinition } from '@appsemble/lang-sdk';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  AppBuildSnapshot,
  AppSnapshot,
  BlockAsset,
  BlockVersion,
  Organization,
} from '../models/index.js';
import {
  createAppBuildManifest,
  getMissingBlockManifestIdentifiers,
  pruneAppBuildSnapshots,
  type SnapshotBlockManifest,
} from './appBuildManifest.js';

describe('createAppBuildManifest', () => {
  beforeEach(async () => {
    await Organization.bulkCreate([{ id: 'test' }, { id: 'appsemble' }]);

    const [a00, b02, a10, a11, form0364] = await BlockVersion.bulkCreate([
      { name: 'a', OrganizationId: 'test', version: '0.0.0' },
      { name: 'b', OrganizationId: 'test', version: '0.0.2' },
      { name: 'a', OrganizationId: 'appsemble', version: '0.1.0' },
      { name: 'a', OrganizationId: 'appsemble', version: '0.1.1' },
      { name: 'form', OrganizationId: 'appsemble', version: '0.36.4' },
    ]);

    await BlockAsset.bulkCreate([
      {
        OrganizationId: 'test',
        BlockVersionId: a00.id,
        filename: 'a0.css',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'test',
        BlockVersionId: a00.id,
        filename: 'a0.js',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'test',
        BlockVersionId: b02.id,
        filename: 'b2.css',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'test',
        BlockVersionId: b02.id,
        filename: 'b2.js',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'appsemble',
        BlockVersionId: a10.id,
        filename: 'a10.css',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'appsemble',
        BlockVersionId: a10.id,
        filename: 'a10.js',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'appsemble',
        BlockVersionId: a11.id,
        filename: 'a11.css',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'appsemble',
        BlockVersionId: a11.id,
        filename: 'a11.js',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'appsemble',
        BlockVersionId: form0364.id,
        filename: 'form.css',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'appsemble',
        BlockVersionId: form0364.id,
        filename: 'form.js',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'appsemble',
        BlockVersionId: form0364.id,
        filename: '3317.form.js',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'appsemble',
        BlockVersionId: form0364.id,
        filename: '5586.form.js',
        content: Buffer.from(''),
      },
      {
        OrganizationId: 'appsemble',
        BlockVersionId: form0364.id,
        filename: 'form.js.map',
        content: Buffer.from(''),
      },
    ]);
  });

  it('should build block manifests from block dependencies', async () => {
    const definition: AppDefinition = {
      name: 'Test App',
      defaultPage: 'Tasks',
      pages: [
        {
          name: 'Tasks',
          blocks: [
            { type: '@test/a', version: '0.0.0' },
            { type: 'a', version: '0.1.0' },
          ],
        },
        {
          name: 'Updates',
          blocks: [
            {
              type: 'a',
              version: '0.1.1',
              actions: {
                submit: {
                  type: 'dialog',
                  blocks: [{ type: '@test/b', version: '0.0.2' }],
                },
              },
            },
          ],
        },
      ],
    };

    const result = await createAppBuildManifest(definition);

    expect(result).toStrictEqual({
      version: 1,
      blockManifests: [
        {
          actions: null,
          events: null,
          files: ['a10.css', 'a10.js'],
          layout: null,
          name: '@appsemble/a',
          version: '0.1.0',
        },
        {
          actions: null,
          events: null,
          files: ['a11.css', 'a11.js'],
          layout: null,
          name: '@appsemble/a',
          version: '0.1.1',
        },
        {
          actions: null,
          events: null,
          files: ['a0.css', 'a0.js'],
          layout: null,
          name: '@test/a',
          version: '0.0.0',
        },
        {
          actions: null,
          events: null,
          files: ['b2.css', 'b2.js'],
          layout: null,
          name: '@test/b',
          version: '0.0.2',
        },
      ],
    });
  });

  it('should keep chunk files but strip source maps from stored manifests', async () => {
    const definition: AppDefinition = {
      name: 'Test App',
      defaultPage: 'Login',
      pages: [{ name: 'Login', blocks: [{ type: 'form', version: '0.36.4' }] }],
    };

    const result = await createAppBuildManifest(definition);

    expect(result.blockManifests).toStrictEqual([
      {
        actions: null,
        events: null,
        files: ['3317.form.js', '5586.form.js', 'form.css', 'form.js'],
        layout: null,
        name: '@appsemble/form',
        version: '0.36.4',
      },
    ]);
  });

  it('should handle app definitions without pages', async () => {
    const definition = {
      name: 'Template App',
      pages: [],
    } as unknown as AppDefinition;

    const result = await createAppBuildManifest(definition);

    expect(result).toStrictEqual({
      version: 1,
      blockManifests: [],
    });
  });

  it('should report missing block manifest identifiers', () => {
    const definition: AppDefinition = {
      name: 'Test App',
      defaultPage: 'Test Page',
      pages: [
        {
          name: 'Test Page',
          blocks: [
            { type: 'a', version: '0.1.0' },
            { type: 'a', version: '0.1.0' },
            { type: '@test/b', version: '0.0.2' },
            { type: '@test/b', version: '0.0.2' },
          ],
        },
      ],
    };
    const blockManifests: SnapshotBlockManifest[] = [
      {
        files: [],
        name: '@appsemble/a',
        version: '0.1.0',
      },
    ];

    expect(getMissingBlockManifestIdentifiers(definition, blockManifests)).toStrictEqual([
      '@test/b@0.0.2',
    ]);
  });

  it('should report no missing block manifest identifiers for complete manifests', () => {
    const definition: AppDefinition = {
      name: 'Test App',
      defaultPage: 'Test Page',
      pages: [
        {
          name: 'Test Page',
          blocks: [
            { type: 'a', version: '0.1.0' },
            { type: '@test/b', version: '0.0.2' },
          ],
        },
      ],
    };
    const blockManifests: SnapshotBlockManifest[] = [
      {
        files: [],
        name: '@appsemble/a',
        version: '0.1.0',
      },
      {
        files: [],
        name: '@test/b',
        version: '0.0.2',
      },
    ];

    expect(getMissingBlockManifestIdentifiers(definition, blockManifests)).toStrictEqual([]);
  });

  it('should prune older build snapshots while preserving app snapshot history', async () => {
    const app = await App.create({
      OrganizationId: 'test',
      definition: { name: 'Test App' },
      path: 'test-app',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      coreStyle: '',
      sharedStyle: '',
    });
    const snapshots = await AppSnapshot.bulkCreate([
      { AppId: app.id, yaml: 'name: Test App 1\n' },
      { AppId: app.id, yaml: 'name: Test App 2\n' },
      { AppId: app.id, yaml: 'name: Test App 3\n' },
      { AppId: app.id, yaml: 'name: Test App without build\n' },
    ]);

    await AppBuildSnapshot.bulkCreate(
      snapshots.map(({ id }) => ({
        AppSnapshotId: id,
        buildManifestJson: { version: 1, blockManifests: [] },
      })),
    );

    const deleted = await pruneAppBuildSnapshots({
      AppSnapshotId: snapshots[2].id,
      appId: app.id,
    });

    expect(deleted).toBe(2);
    expect(await AppSnapshot.count({ where: { AppId: app.id } })).toBe(4);
    expect(await AppBuildSnapshot.findAll({ order: [['AppSnapshotId', 'ASC']] })).toStrictEqual([
      expect.objectContaining({
        AppSnapshotId: snapshots[2].id,
      }),
      expect.objectContaining({
        AppSnapshotId: snapshots[3].id,
      }),
    ]);
  });
});
