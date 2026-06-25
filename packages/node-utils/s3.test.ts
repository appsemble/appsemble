import { S3Error } from 'minio';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { logger } from './logger.js';
import { deleteS3File, deleteS3Files, initS3Client } from './s3.js';

const { removeObjects } = vi.hoisted(() => ({
  removeObjects: vi.fn(),
}));

vi.mock('minio', async (importOriginal) => {
  const actual = await importOriginal<typeof import('minio')>();
  return {
    ...actual,
    Client: class {
      removeObjects = removeObjects;
    },
  };
});

function s3Error(code: string): S3Error {
  const error = new S3Error('boom');
  error.code = code;
  return error;
}

beforeAll(() => {
  initS3Client({ accessKey: 'key', secretKey: 'secret', endPoint: 'localhost', useSSL: false });
});

describe('deleteS3Files', () => {
  it('treats a missing bucket as nothing to delete and warns about it', async () => {
    vi.spyOn(logger, 'warn').mockImplementation(() => logger);
    removeObjects.mockRejectedValueOnce(s3Error('NoSuchBucket'));

    expect(await deleteS3Files('app-1216', ['asset-id'])).toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('app-1216'));
  });

  it('surfaces other S3 errors to the caller', async () => {
    const error = s3Error('AccessDenied');
    removeObjects.mockRejectedValueOnce(error);

    await expect(deleteS3Files('app-1216', ['asset-id'])).rejects.toBe(error);
  });
});

describe('deleteS3File', () => {
  it('treats a missing bucket as nothing to delete', async () => {
    removeObjects.mockRejectedValueOnce(s3Error('NoSuchBucket'));

    expect(await deleteS3File('app-1216', 'asset-id')).toBeUndefined();
  });

  it('surfaces other S3 errors to the caller', async () => {
    const error = s3Error('AccessDenied');
    removeObjects.mockRejectedValueOnce(error);

    await expect(deleteS3File('app-1216', 'asset-id')).rejects.toBe(error);
  });
});
