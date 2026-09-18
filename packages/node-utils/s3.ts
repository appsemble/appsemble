import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { buffer as streamToBuffer } from 'node:stream/consumers';

import {
  type BucketLocationConstraint,
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

import { logger } from './logger.js';

let s3Client: S3Client;
let s3Bucket: string | undefined;
let s3Region: string;

export const blockAssetsBucketName = 'appsemble-block-assets';

// S3 limits the number of keys in a single DeleteObjects request.
const deleteBatchSize = 1000;

export interface S3Location {
  bucket: string;
  key: string;
}

export interface S3FileStats {
  etag: string;
  lastModified: Date;
  metadata: Record<string, string>;
  size: number;
}

export interface S3FileReference extends S3FileStats {
  key: string;
}

export interface InitS3ClientParams {
  endPoint: string;
  port?: number;
  useSSL?: boolean;
  accessKey: string;
  secretKey: string;
  region?: string;
  pathStyle?: boolean;

  /**
   * The single, pre-provisioned bucket that holds all objects.
   *
   * When set, app assets live under `apps/<appId>/` and block assets under `blocks/` in this
   * bucket, and buckets are never created or listed. When unset, every app gets its own
   * `app-<appId>` bucket and block assets live in the `appsemble-block-assets` bucket, both created
   * on demand.
   */
  bucket?: string;
}

export function initS3Client({
  accessKey,
  bucket,
  endPoint,
  pathStyle = true,
  port = 9000,
  region = 'us-east-1',
  secretKey,
  useSSL = true,
}: InitS3ClientParams): void {
  try {
    s3Client = new S3Client({
      endpoint: `${useSSL ? 'https' : 'http'}://${endPoint}:${port}`,
      region,
      forcePathStyle: pathStyle,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      // Only add checksums where S3 requires them, so requests stay compatible with
      // S3-compatible stores that do not implement flexible checksums.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
    // S3 requires a checksum on DeleteObjects. The SDK sends CRC32, which object stores from
    // before the flexible checksums reject in favour of Content-MD5.
    s3Client.middlewareStack.add(
      (next, context) => (args) => {
        const request = args.request as { body?: string; headers: Record<string, string> };
        if (context.commandName === 'DeleteObjectsCommand' && request.body) {
          request.headers['content-md5'] = createHash('md5').update(request.body).digest('base64');
        }
        return next(args);
      },
      { step: 'finalizeRequest', name: 'deleteObjectsContentMd5' },
    );
    s3Bucket = bucket || undefined;
    s3Region = region;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

/**
 * @returns The configured single bucket, or `undefined` in the bucket-per-app layout.
 */
export function getS3Bucket(): string | undefined {
  return s3Bucket;
}

function getAppAssetsBucket(appId: number): string {
  return s3Bucket ?? `app-${appId}`;
}

export function getAppAssetLocation(appId: number, assetId: string): S3Location {
  return {
    bucket: getAppAssetsBucket(appId),
    key: s3Bucket ? `apps/${appId}/${assetId}` : assetId,
  };
}

export function getBlockAssetLocation(storageKey: string): S3Location {
  return s3Bucket
    ? { bucket: s3Bucket, key: `blocks/${storageKey}` }
    : { bucket: blockAssetsBucketName, key: storageKey };
}

export function isS3ErrorCode(error: unknown, code: string): boolean {
  return error instanceof S3ServiceException && error.name === code;
}

async function ensureBucket(name: string): Promise<void> {
  if (s3Bucket) {
    return;
  }
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: name }));
    return;
  } catch (error) {
    if (!isS3ErrorCode(error, 'NotFound')) {
      logger.error(error);
      throw error;
    }
  }
  try {
    await s3Client.send(
      new CreateBucketCommand({
        Bucket: name,
        // S3 rejects a location constraint for its default region.
        ...(s3Region === 'us-east-1'
          ? {}
          : {
              CreateBucketConfiguration: {
                LocationConstraint: s3Region as BucketLocationConstraint,
              },
            }),
      }),
    );
  } catch (error) {
    if (isS3ErrorCode(error, 'BucketAlreadyOwnedByYou')) {
      logger.warn(error);
      logger.info('This was probably called in an asynchronous batch upload.');
      return;
    }
    logger.error(error);
    throw error;
  }
}

function splitMetadata(metadata: Record<string, string> = {}): {
  CacheControl?: string;
  ContentType?: string;
  Metadata: Record<string, string>;
} {
  const result: ReturnType<typeof splitMetadata> = { Metadata: {} };
  for (const [name, value] of Object.entries(metadata)) {
    switch (name.toLowerCase()) {
      case 'cache-control':
        result.CacheControl = value;
        break;
      case 'content-type':
        result.ContentType = value;
        break;
      default:
        result.Metadata[name] = value;
    }
  }
  return result;
}

async function putObject(
  bucket: string,
  key: string,
  content: Buffer | Readable | string,
  size?: number,
  metadata?: Record<string, string>,
): Promise<void> {
  const params = { Bucket: bucket, Key: key, Body: content, ...splitMetadata(metadata) };
  if (content instanceof Readable && size == null) {
    // S3 needs the object size up front, so a stream of unknown length goes through a multipart
    // upload.
    await new Upload({ client: s3Client, params }).done();
    return;
  }
  await s3Client.send(
    new PutObjectCommand({
      ...params,
      ContentLength: size ?? Buffer.byteLength(content as Buffer | string),
    }),
  );
}

export async function uploadS3File(
  bucket: string,
  key: string,
  content: Buffer | Readable | string,
  size?: number,
  metadata?: Record<string, string>,
): Promise<void> {
  try {
    await ensureBucket(bucket);
    await putObject(bucket, key, content, size, metadata);
  } catch (error) {
    if (isS3ErrorCode(error, 'NoSuchBucket') && !s3Bucket && !(content instanceof Readable)) {
      logger.warn(error);
      await ensureBucket(bucket);
      await putObject(bucket, key, content, size, metadata);
      return;
    }

    logger.error(error);
    throw error;
  }
}

export async function uploadS3FileFromPath(
  bucket: string,
  key: string,
  path: string,
): Promise<void> {
  const { size } = await stat(path);
  await uploadS3File(bucket, key, createReadStream(path), size);
}

export async function getS3File(bucket: string, key: string): Promise<Readable> {
  try {
    const { Body } = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    return Body as Readable;
  } catch (error) {
    logger.error(error);
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks) - Severe
    return null;
  }
}

export async function getS3FileBuffer(bucket: string, key: string): Promise<Buffer> {
  try {
    const stream = await getS3File(bucket, key);
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks) - Severe
    return stream ? streamToBuffer(stream) : null;
  } catch (error) {
    logger.error(error);
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks) - Severe
    return null;
  }
}

export async function getS3FileStats(bucket: string, key: string): Promise<S3FileStats> {
  try {
    const { CacheControl, ContentLength, ContentType, ETag, LastModified, Metadata } =
      await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return {
      etag: ETag!,
      lastModified: LastModified!,
      metadata: {
        ...(CacheControl && { 'cache-control': CacheControl }),
        ...(ContentType && { 'content-type': ContentType }),
        ...Metadata,
      },
      size: ContentLength!,
    };
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

async function listS3Keys(bucket: string, prefix?: string): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;
  do {
    const { Contents, NextContinuationToken } = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );
    for (const { Key } of Contents ?? []) {
      if (Key) {
        keys.push(Key);
      }
    }
    continuationToken = NextContinuationToken;
  } while (continuationToken);
  return keys;
}

export async function listS3Files(bucket: string, prefix?: string): Promise<S3FileReference[]> {
  const keys = await listS3Keys(bucket, prefix);

  return Promise.all(keys.map(async (key) => ({ key, ...(await getS3FileStats(bucket, key)) })));
}

export async function setS3BucketPolicy(bucket: string, policy: string): Promise<void> {
  try {
    await ensureBucket(bucket);
    await s3Client.send(new PutBucketPolicyCommand({ Bucket: bucket, Policy: policy }));
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

async function deleteObjects(bucket: string, keys: string[]): Promise<void> {
  for (let index = 0; index < keys.length; index += deleteBatchSize) {
    await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: keys.slice(index, index + deleteBatchSize).map((Key) => ({ Key })),
          Quiet: true,
        },
      }),
    );
  }
}

export async function deleteS3Files(bucket: string, keys: string[]): Promise<void> {
  try {
    await deleteObjects(bucket, keys);
  } catch (error) {
    if (isS3ErrorCode(error, 'NoSuchBucket')) {
      logger.warn(`S3 bucket "${bucket}" does not exist; skipping deletion`);
      return;
    }
    logger.error(error);
    throw error;
  }
}

export async function deleteS3File(bucket: string, key: string): Promise<void> {
  await deleteS3Files(bucket, [key]);
}

export async function deleteAppAssetObjects(appId: number, assetIds: string[]): Promise<void> {
  await deleteS3Files(
    getAppAssetsBucket(appId),
    assetIds.map((assetId) => getAppAssetLocation(appId, assetId).key),
  );
}

/**
 * Remove every object this client can reach.
 *
 * In the single-bucket layout this empties the configured bucket. In the bucket-per-app layout
 * this empties and removes every bucket.
 */
export async function clearAllS3Buckets(): Promise<void> {
  try {
    if (s3Bucket) {
      await deleteObjects(s3Bucket, await listS3Keys(s3Bucket));
      return;
    }
    const { Buckets } = await s3Client.send(new ListBucketsCommand({}));
    for (const { Name: bucket } of Buckets ?? []) {
      try {
        await deleteObjects(bucket!, await listS3Keys(bucket!));
        try {
          await s3Client.send(new DeleteBucketCommand({ Bucket: bucket }));
        } catch (error) {
          if (!isS3ErrorCode(error, 'BucketNotEmpty')) {
            throw error;
          }
          // Objects uploaded while the bucket was being emptied.
          await deleteObjects(bucket!, await listS3Keys(bucket!));
          await s3Client.send(new DeleteBucketCommand({ Bucket: bucket }));
        }
      } catch (error) {
        if (!isS3ErrorCode(error, 'NoSuchBucket')) {
          throw error;
        }
      }
    }
  } catch (error) {
    logger.error(error);
    throw error;
  }
}
