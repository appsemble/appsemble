import { access, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import type { Readable } from 'node:stream';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { uploadAssets } from './assets.js';
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
      ).rejects.toThrowError('upload failed');

      await expect(access(path, constants.F_OK)).rejects.toMatchObject({ code: 'ENOENT' });
    });
  });
});
