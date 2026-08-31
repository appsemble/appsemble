import { Readable } from 'node:stream';

import { buffer as streamToBuffer } from 'node:stream/consumers';
import { type BucketItemStat, Client, S3Error } from 'minio';

import { logger } from './logger.js';

let s3Client: Client;
const s3StatConcurrency = 10;

export interface S3FileReference {
  etag: string;
  key: string;
  lastModified: Date;
  metadata: BucketItemStat['metaData'];
  size: number;
}

export interface InitS3ClientParams {
  endPoint: string;
  port?: number;
  useSSL?: boolean;
  accessKey: string;
  secretKey: string;
}

export function initS3Client({
  accessKey,
  endPoint,
  port = 9000,
  secretKey,
  useSSL = true,
}: InitS3ClientParams): void {
  try {
    s3Client = new Client({
      endPoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

async function ensureBucket(name: string): Promise<void> {
  try {
    const bucketExists = await s3Client.bucketExists(name);
    if (!bucketExists) {
      try {
        await s3Client.makeBucket(name);
      } catch (makeBucketError) {
        if (
          makeBucketError instanceof S3Error &&
          makeBucketError.code === 'BucketAlreadyOwnedByYou'
        ) {
          logger.warn(makeBucketError);
          logger.info('This was probably called in an asynchronous batch upload.');
        } else {
          throw makeBucketError;
        }
      }
    }
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

function isS3ErrorCode(error: unknown, code: string): boolean {
  return error instanceof S3Error && error.code === code;
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
    await s3Client.putObject(bucket, key, content, size, metadata);
  } catch (error) {
    if (isS3ErrorCode(error, 'NoSuchBucket') && !(content instanceof Readable)) {
      logger.warn(error);
      await ensureBucket(bucket);
      await s3Client.putObject(bucket, key, content, size, metadata);
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
  try {
    await ensureBucket(bucket);
    await s3Client.fPutObject(bucket, key, path);
  } catch (error) {
    if (isS3ErrorCode(error, 'NoSuchBucket')) {
      logger.warn(error);
      await ensureBucket(bucket);
      await s3Client.fPutObject(bucket, key, path);
      return;
    }

    logger.error(error);
    throw error;
  }
}

export async function getS3File(bucket: string, key: string): Promise<Readable> {
  try {
    return await s3Client.getObject(bucket, key);
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

export async function getS3FileStats(bucket: string, key: string): Promise<BucketItemStat> {
  try {
    return await s3Client.statObject(bucket, key);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function listS3Files(bucket: string, prefix = ''): Promise<S3FileReference[]> {
  const keys = await new Promise<string[]>((resolve, reject) => {
    const objects: string[] = [];
    const stream = s3Client.listObjectsV2(bucket, prefix, true);

    stream.on('data', (item) => {
      if (item.name) {
        objects.push(item.name);
      }
    });
    stream.on('error', reject);
    stream.on('end', () => resolve(objects));
  });

  const files: S3FileReference[] = [];

  for (let index = 0; index < keys.length; index += s3StatConcurrency) {
    const batch = await Promise.all(
      keys.slice(index, index + s3StatConcurrency).map(async (key) => {
        const stats = await getS3FileStats(bucket, key);

        return {
          etag: stats.etag,
          key,
          lastModified: stats.lastModified,
          metadata: stats.metaData,
          size: stats.size,
        };
      }),
    );

    files.push(...batch);
  }

  return files;
}

export async function setS3BucketPolicy(bucket: string, policy: string): Promise<void> {
  try {
    await ensureBucket(bucket);
    await s3Client.setBucketPolicy(bucket, policy);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function deleteS3Files(bucket: string, keys: string[]): Promise<void> {
  try {
    await s3Client.removeObjects(bucket, keys);
  } catch (error) {
    if (error instanceof S3Error && error.code === 'NoSuchBucket') {
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

export async function clearAllS3Buckets(): Promise<void> {
  try {
    const buckets = await s3Client.listBuckets();
    for (const bucket of buckets) {
      try {
        const objectsStream = s3Client.listObjectsV2(bucket.name, '', true);

        const objects: string[] = [];
        for await (const o of objectsStream) {
          objects.push(o.name);
        }

        await s3Client.removeObjects(bucket.name, objects);
        try {
          await s3Client.removeBucket(bucket.name);
        } catch (error) {
          if (isS3ErrorCode(error, 'NoSuchBucket')) {
            continue;
          }
          if (!isS3ErrorCode(error, 'BucketNotEmpty')) {
            throw error;
          }

          const remainingObjectsStream = s3Client.listObjectsV2(bucket.name, '', true);
          const remainingObjects: string[] = [];
          for await (const o of remainingObjectsStream) {
            remainingObjects.push(o.name);
          }
          await s3Client.removeObjects(bucket.name, remainingObjects);
          await s3Client.removeBucket(bucket.name);
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
