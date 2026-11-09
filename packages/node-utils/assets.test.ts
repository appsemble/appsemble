import { access, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import type { Readable } from 'node:stream';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { type AssetHeaderOptions, setAssetHeaders, uploadAssets } from './assets.js';
import { logger } from './logger.js';
import * as s3 from './s3.js';

async function withTempFile(contents: Buffer, fn: (path: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), 'upload-assets-'));
  const path = join(dir, 'asset.bin');

  try {
    await writeFile(path, contents);
    await fn(path);
  } finally {
    await rm(dir, { force: true, recursive: true });
  }
}

describe('setAssetHeaders', () => {
  let options: AssetHeaderOptions;

  beforeAll(async () => {
    const app = new Koa();
    app.use((ctx) => {
      // Stand in for the CORS middleware, which exposes these on every API response before the
      // asset controllers run.
      ctx.set('Access-Control-Expose-Headers', 'ETag, X-Appsemble-Version');
      setAssetHeaders(ctx, options);
      ctx.body = '';
    });
    await setTestApp(app);
  });

  it('should let a response addressed by asset id be cached indefinitely', async () => {
    options = { mime: 'image/png', immutable: true };

    const { headers } = await request.get('/');

    expect(headers['cache-control']).toBe('max-age=31536000,immutable');
  });

  it('should bound how long a response addressed by asset name may be cached', async () => {
    options = { mime: 'image/png', immutable: false };

    const { headers } = await request.get('/');

    expect(headers['cache-control']).toBe('max-age=3600');
  });

  it('should keep headers exposed by earlier middleware exposed', async () => {
    options = { mime: 'image/png', immutable: true };

    const { headers } = await request.get('/');

    expect(headers['access-control-expose-headers']).toBe(
      'ETag, X-Appsemble-Version, Content-Disposition',
    );
  });
});

describe('uploadAssets', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should remove temporary uploads if uploading an asset fails', async () => {
    vi.spyOn(logger, 'error').mockImplementation(() => logger);
    vi.spyOn(s3, 'uploadS3File').mockImplementation(async (...parameters) => {
      const stream = parameters[2] as Readable;

      await new Promise<void>((resolve, reject) => {
        stream.once('open', () => resolve());
        stream.once('error', reject);
      });
      throw new Error('upload failed');
    });

    await withTempFile(Buffer.from('test'), async (path) => {
      await expect(
        uploadAssets(1, [{ id: 'asset-id', mime: 'application/octet-stream', path }]),
      ).rejects.toThrow('upload failed');

      await expect(access(path, constants.F_OK)).rejects.toMatchObject({ code: 'ENOENT' });
    });
  });
});
