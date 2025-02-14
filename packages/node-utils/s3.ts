import { type Readable } from 'node:stream';

import { streamToBuffer } from 'memfs/lib/node/util.js';
import { type BucketItemStat, Client, S3Error } from 'minio';

import { logger } from './logger.js';

let s3Client: Client;

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

export async function uploadS3File(
  bucket: string,
  key: string,
  content: Buffer | Readable | string,
): Promise<void> {
  try {
    await ensureBucket(bucket);
    await s3Client.putObject(bucket, key, content);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function getS3File(bucket: string, key: string): Promise<Readable> {
  try {
    return await s3Client.getObject(bucket, key);
  } catch (error) {
    logger.error(error);
    return null;
  }
}

export async function getS3FileBuffer(bucket: string, key: string): Promise<Buffer> {
  try {
    const stream = await getS3File(bucket, key);
    return stream ? streamToBuffer(stream) : null;
  } catch (error) {
    logger.error(error);
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

export async function deleteS3File(bucket: string, key: string): Promise<void> {
  try {
    await s3Client.removeObject(bucket, key);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function deleteS3Files(bucket: string, keys: string[]): Promise<void> {
  try {
    await s3Client.removeObjects(bucket, keys);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function clearAllS3Buckets(): Promise<void> {
  try {
    const buckets = await s3Client.listBuckets();
    for (const bucket of buckets) {
      const objectsStream = s3Client.listObjectsV2(bucket.name, '', true);

      const objects: string[] = [];
      for await (const o of objectsStream) {
        objects.push(o.name);
      }

      await s3Client.removeObjects(bucket.name, objects);
      await s3Client.removeBucket(bucket.name);
    }
  } catch (error) {
    logger.error(error);
    throw error;
  }
}
