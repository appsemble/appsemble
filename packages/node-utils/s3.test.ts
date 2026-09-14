import { Readable } from 'node:stream';
import { buffer as streamToBuffer } from 'node:stream/consumers';

import { S3Client, S3ServiceException } from '@aws-sdk/client-s3';
import { beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import { logger } from './logger.js';
import {
  clearAllS3Buckets,
  deleteAppAssetObjects,
  deleteS3File,
  deleteS3Files,
  getAppAssetLocation,
  getBlockAssetLocation,
  getS3FileStats,
  initS3Client,
  setS3BucketPolicy,
  uploadS3File,
} from './s3.js';

interface Command {
  constructor: { name: string };
  input: Record<string, unknown>;
}

type Send = (command: Command) => Promise<unknown> | unknown;

let send: MockInstance<Send>;

function s3Error(code: string): S3ServiceException {
  return new S3ServiceException({ name: code, $fault: 'client', $metadata: {} });
}

function sentCommands(): [string, Record<string, unknown>][] {
  return send.mock.calls.map(([command]) => [command.constructor.name, command.input]);
}

function sentCommandNames(): string[] {
  return sentCommands().map(([name]) => name);
}

const credentials = { accessKey: 'key', secretKey: 'secret', endPoint: 'localhost', useSSL: false };
const storageKey = 'appsemble/form/1.0.0/block-version-id/form.js';

beforeEach(() => {
  send = vi.spyOn(S3Client.prototype as unknown as { send: Send }, 'send').mockResolvedValue({});
});

describe('bucket-per-app layout', () => {
  beforeEach(() => {
    initS3Client(credentials);
  });

  it('stores app assets in a bucket per app', () => {
    expect(getAppAssetLocation(1216, 'asset-id')).toStrictEqual({
      bucket: 'app-1216',
      key: 'asset-id',
    });
  });

  it('stores block assets in the block assets bucket', () => {
    expect(getBlockAssetLocation(storageKey)).toStrictEqual({
      bucket: 'appsemble-block-assets',
      key: storageKey,
    });
  });

  it('creates a missing bucket before uploading into it', async () => {
    send.mockRejectedValueOnce(s3Error('NotFound'));

    await uploadS3File('app-1216', 'asset-id', 'payload');

    expect(sentCommands()).toStrictEqual([
      ['HeadBucketCommand', { Bucket: 'app-1216' }],
      ['CreateBucketCommand', { Bucket: 'app-1216' }],
      ['PutObjectCommand', expect.objectContaining({ Bucket: 'app-1216', Key: 'asset-id' })],
    ]);
  });

  it('removes every bucket when clearing', async () => {
    send.mockImplementation((command: Command) => {
      switch (command.constructor.name) {
        case 'ListBucketsCommand':
          return { Buckets: [{ Name: 'app-1' }, { Name: 'appsemble-block-assets' }] };
        case 'ListObjectsV2Command':
          return { Contents: [{ Key: `${command.input.Bucket}-object` }] };
        default:
          return {};
      }
    });

    await clearAllS3Buckets();

    expect(sentCommands()).toStrictEqual([
      ['ListBucketsCommand', {}],
      ['ListObjectsV2Command', expect.objectContaining({ Bucket: 'app-1' })],
      [
        'DeleteObjectsCommand',
        expect.objectContaining({
          Bucket: 'app-1',
          Delete: { Objects: [{ Key: 'app-1-object' }], Quiet: true },
        }),
      ],
      ['DeleteBucketCommand', { Bucket: 'app-1' }],
      ['ListObjectsV2Command', expect.objectContaining({ Bucket: 'appsemble-block-assets' })],
      ['DeleteObjectsCommand', expect.objectContaining({ Bucket: 'appsemble-block-assets' })],
      ['DeleteBucketCommand', { Bucket: 'appsemble-block-assets' }],
    ]);
  });
});

describe('single-bucket layout', () => {
  beforeEach(() => {
    initS3Client({ ...credentials, bucket: 'objects' });
  });

  it('stores app assets under a prefix per app', () => {
    expect(getAppAssetLocation(1216, 'asset-id')).toStrictEqual({
      bucket: 'objects',
      key: 'apps/1216/asset-id',
    });
  });

  it('stores block assets under the blocks prefix', () => {
    expect(getBlockAssetLocation(storageKey)).toStrictEqual({
      bucket: 'objects',
      key: `blocks/${storageKey}`,
    });
  });

  it('uploads without checking or creating buckets', async () => {
    await uploadS3File('objects', 'apps/1216/asset-id', 'payload');

    expect(sentCommands()).toStrictEqual([
      [
        'PutObjectCommand',
        expect.objectContaining({ Bucket: 'objects', Key: 'apps/1216/asset-id' }),
      ],
    ]);
  });

  it('does not recreate the bucket when an upload reports it missing', async () => {
    const error = s3Error('NoSuchBucket');
    send.mockRejectedValueOnce(error);

    await expect(uploadS3File('objects', 'apps/1216/asset-id', 'payload')).rejects.toBe(error);
    expect(sentCommandNames()).toStrictEqual(['PutObjectCommand']);
  });

  it('only empties the configured bucket when clearing', async () => {
    send.mockImplementation((command: Command) =>
      command.constructor.name === 'ListObjectsV2Command'
        ? { Contents: [{ Key: 'apps/1/a' }, { Key: 'blocks/b' }] }
        : {},
    );

    await clearAllS3Buckets();

    expect(sentCommands()).toStrictEqual([
      ['ListObjectsV2Command', expect.objectContaining({ Bucket: 'objects' })],
      [
        'DeleteObjectsCommand',
        {
          Bucket: 'objects',
          Delete: { Objects: [{ Key: 'apps/1/a' }, { Key: 'blocks/b' }], Quiet: true },
        },
      ],
    ]);
  });

  it('deletes app assets under their prefix', async () => {
    await deleteAppAssetObjects(1216, ['a', 'b']);

    expect(sentCommands()).toStrictEqual([
      [
        'DeleteObjectsCommand',
        {
          Bucket: 'objects',
          Delete: { Objects: [{ Key: 'apps/1216/a' }, { Key: 'apps/1216/b' }], Quiet: true },
        },
      ],
    ]);
  });

  it('sets a bucket policy without creating the bucket', async () => {
    await setS3BucketPolicy('objects', '{}');

    expect(sentCommands()).toStrictEqual([
      ['PutBucketPolicyCommand', { Bucket: 'objects', Policy: '{}' }],
    ]);
  });
});

describe('uploadS3File', () => {
  beforeEach(() => {
    initS3Client(credentials);
  });

  it('stores the content type and cache control alongside custom metadata', async () => {
    await uploadS3File('app-1216', 'asset-id', 'payload', undefined, {
      'Cache-Control': 'public,max-age=31536000,immutable',
      'Content-Type': 'text/plain',
      'x-custom': 'value',
    });

    expect(sentCommands()).toStrictEqual([
      ['HeadBucketCommand', { Bucket: 'app-1216' }],
      [
        'PutObjectCommand',
        {
          Body: 'payload',
          Bucket: 'app-1216',
          CacheControl: 'public,max-age=31536000,immutable',
          ContentLength: 7,
          ContentType: 'text/plain',
          Key: 'asset-id',
          Metadata: { 'x-custom': 'value' },
        },
      ],
    ]);
  });

  it('sends the size of a stream of known length', async () => {
    await uploadS3File('app-1216', 'asset-id', Readable.from('payload'), 7);

    expect(sentCommands()).toStrictEqual([
      ['HeadBucketCommand', { Bucket: 'app-1216' }],
      [
        'PutObjectCommand',
        expect.objectContaining({ Body: expect.any(Readable), ContentLength: 7 }),
      ],
    ]);
  });

  it('sends the full content of a stream of unknown length', async () => {
    await uploadS3File('app-1216', 'asset-id', Readable.from('payload'));

    const [, [name, input]] = sentCommands();
    expect(name).toBe('PutObjectCommand');
    expect(Buffer.from(input.Body as Uint8Array).toString()).toBe('payload');
  });

  it('fails if a stream upload loses its bucket after consuming the stream', async () => {
    const error = s3Error('NoSuchBucket');
    send.mockImplementation(async (command: Command) => {
      if (command.constructor.name === 'PutObjectCommand') {
        await streamToBuffer(command.input.Body as Readable);
        throw error;
      }
      return {};
    });

    await expect(uploadS3File('app-1216', 'asset-id', Readable.from('payload'), 7)).rejects.toBe(
      error,
    );
  });
});

describe('getS3FileStats', () => {
  beforeEach(() => {
    initS3Client(credentials);
  });

  it('exposes the content type and cache control as metadata', async () => {
    const lastModified = new Date('2026-01-01T00:00:00Z');
    send.mockResolvedValueOnce({
      CacheControl: 'public,max-age=31536000,immutable',
      ContentLength: 7,
      ContentType: 'text/plain',
      ETag: '"etag"',
      LastModified: lastModified,
      Metadata: { 'x-custom': 'value' },
    });

    expect(await getS3FileStats('app-1216', 'asset-id')).toStrictEqual({
      etag: '"etag"',
      lastModified,
      metadata: {
        'cache-control': 'public,max-age=31536000,immutable',
        'content-type': 'text/plain',
        'x-custom': 'value',
      },
      size: 7,
    });
  });
});

describe('deleteS3Files', () => {
  beforeEach(() => {
    initS3Client(credentials);
  });

  it('treats a missing bucket as nothing to delete and warns about it', async () => {
    vi.spyOn(logger, 'warn').mockImplementation(() => logger);
    send.mockRejectedValueOnce(s3Error('NoSuchBucket'));

    expect(await deleteS3Files('app-1216', ['asset-id'])).toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('app-1216'));
  });

  it('surfaces other S3 errors to the caller', async () => {
    const error = s3Error('AccessDenied');
    send.mockRejectedValueOnce(error);

    await expect(deleteS3Files('app-1216', ['asset-id'])).rejects.toBe(error);
  });

  it('deletes in batches of at most 1000 keys', async () => {
    const keys = Array.from({ length: 1001 }, (unused, index) => `asset-${index}`);

    await deleteS3Files('app-1216', keys);

    expect(
      sentCommands().map(([, input]) => (input.Delete as { Objects: unknown[] }).Objects.length),
    ).toStrictEqual([1000, 1]);
  });
});

describe('deleteS3File', () => {
  beforeEach(() => {
    initS3Client(credentials);
  });

  it('treats a missing bucket as nothing to delete', async () => {
    send.mockRejectedValueOnce(s3Error('NoSuchBucket'));

    expect(await deleteS3File('app-1216', 'asset-id')).toBeUndefined();
  });

  it('surfaces other S3 errors to the caller', async () => {
    const error = s3Error('AccessDenied');
    send.mockRejectedValueOnce(error);

    await expect(deleteS3File('app-1216', 'asset-id')).rejects.toBe(error);
  });
});
