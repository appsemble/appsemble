import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { type ActionDefinition } from '@appsemble/lang-sdk';
import { TempFile } from '@appsemble/node-utils';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import * as resourceActions from './resource.js';
import { App, getAppDB, Organization } from '../../models/index.js';
import { options } from '../../options/options.js';
import { handleAction } from '../action.js';
import { argv, setArgv } from '../argv.js';
import { Mailer } from '../email/Mailer.js';

let mailer: Mailer;

async function withTempFile(contents: Buffer, fn: (path: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), 'resource-cleanup-'));
  const path = join(dir, 'asset.bin');

  try {
    await writeFile(path, contents);
    await fn(path);
  } finally {
    await rm(dir, { force: true, recursive: true });
  }
}

const exampleApp = (orgId: string, action: ActionDefinition, path = 'test-app'): Promise<App> =>
  App.create({
    OrganizationId: orgId,
    path,
    vapidPrivateKey: '',
    vapidPublicKey: '',
    definition: {
      name: 'Test App',
      defaultPage: '',
      resources: {
        testAssets: {
          roles: ['$public'],
          schema: {
            type: 'object',
            required: ['file'],
            properties: {
              file: { type: 'string', format: 'binary' },
            },
          },
        },
      },
      pages: [],
      cron: {
        list: {
          schedule: '* * * * *',
          action,
        },
      },
    },
  } as Partial<App>);

describe('resource cleanup', () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  beforeEach(async () => {
    vi.clearAllTimers();
    vi.setSystemTime(0);
    setArgv({ host: 'https://example.com' });
    mailer = new Mailer(argv);
    await Organization.create({ id: 'testorg' });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should delete dereferenced s3 assets after resource.patch commit', async () => {
    vi.useRealTimers();
    const cleanupSpy = vi
      .spyOn(resourceActions.resourceCleanup, 'deleteDereferencedS3Assets')
      .mockResolvedValue();

    const action: ActionDefinition = {
      type: 'resource.patch',
      resource: 'testAssets',
    };
    const app = await exampleApp('testorg', action);
    const { Asset, Resource } = await getAppDB(app.id);
    const resource = await Resource.create({
      type: 'testAssets',
      data: { file: 'old-asset' },
    });

    await Asset.create({
      id: 'old-asset',
      ResourceId: resource.id,
      mime: 'application/octet-stream',
      filename: 'old.bin',
    });

    await withTempFile(Buffer.from('new asset'), async (path) => {
      const result = await handleAction(resourceActions.patch as any, {
        app,
        action,
        mailer,
        data: {
          id: resource.id,
          file: new TempFile({ filename: 'new.bin', mime: 'application/octet-stream', path }),
        },
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual(
        expect.objectContaining({
          id: resource.id,
        }),
      );
    });

    expect(await Asset.findByPk('old-asset')).toBeNull();
    expect(cleanupSpy).toHaveBeenCalledWith(app.id, ['old-asset']);
  });
});
