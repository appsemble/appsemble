import { Readable } from 'node:stream';
import { buffer as streamToBuffer } from 'node:stream/consumers';

import { S3Error } from 'minio';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { logger } from './logger.js';
import { deleteS3File, deleteS3Files, initS3Client, listS3Files, uploadS3File } from './s3.js';

const { bucketExists, listObjectsV2, makeBucket, putObject, removeObjects, statObject } =
  vi.hoisted(() => ({
    bucketExists: vi.fn().mockResolvedValue(true),
    listObjectsV2: vi.fn(),
    makeBucket: vi.fn(),
    putObject: vi.fn(),
    removeObjects: vi.fn(),
    statObject: vi.fn(),
  }));

vi.mock('minio', async (importOriginal) => {
  const actual = await importOriginal<typeof import('minio')>();
  return {
    ...actual,
    Client: class {
      bucketExists = bucketExists;

      listObjectsV2 = listObjectsV2;

      makeBucket = makeBucket;

      putObject = putObject;

      removeObjects = removeObjects;

      statObject = statObject;
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

describe('uploadS3File', () => {
  it('fails if a stream upload loses its bucket after consuming the stream', async () => {
    const error = s3Error('NoSuchBucket');
    putObject.mockImplementationOnce(async (...parameters: [string, string, Readable]) => {
      await streamToBuffer(parameters[2]);
      throw error;
    });

    await expect(uploadS3File('app-1216', 'asset-id', Readable.from('payload'))).rejects.toBe(
      error,
    );
  });
});

describe('listS3Files', () => {
  it('limits concurrent metadata requests for large buckets', async () => {
    const keys: string[] = [];
    let activeRequests = 0;
    let maximumActiveRequests = 0;

    for (let index = 0; index < 25; index += 1) {
      keys.push(`backup-${index}`);
    }

    listObjectsV2.mockReturnValueOnce(
      Readable.from(
        keys.map((name) => ({ name })),
        { objectMode: true },
      ),
    );
    statObject.mockImplementation(async (bucket: string, key: string) => {
      activeRequests += 1;
      maximumActiveRequests = Math.max(maximumActiveRequests, activeRequests);
      await new Promise((resolve) => {
        setTimeout(resolve, 1);
      });
      activeRequests -= 1;

      return {
        etag: `${bucket}/${key}`,
        lastModified: new Date('2026-08-31T00:00:00Z'),
        metaData: {},
        size: 1,
      };
    });

    const files = await listS3Files('backups');

    expect(files).toHaveLength(keys.length);
    expect(maximumActiveRequests).toBeLessThanOrEqual(10);
  });
});
