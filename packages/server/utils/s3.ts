import { type Readable } from 'node:stream';

import { logger } from '@appsemble/node-utils';
import { Client } from 'minio';

let s3Client: Client;

export interface InitS3ClientParams {
  endPoint: string;
  port: number;
  useSSL?: boolean;
  accessKey: string;
  secretKey: string;
}

export function initS3Client({
  accessKey,
  endPoint,
  port,
  secretKey,
  useSSL = true,
}: InitS3ClientParams): void {
  s3Client = new Client({
    endPoint,
    port,
    useSSL,
    accessKey,
    secretKey,
  });
}

async function ensureBucket(name: string): Promise<void> {
  try {
    const bucketExists = await s3Client.bucketExists(name);
    if (!bucketExists) {
      await s3Client.makeBucket(name);
    }
  } catch (error) {
    logger.error(error);
  }
}

export async function uploadFile(
  bucket: string,
  key: string,
  content: Buffer | Readable | string,
): Promise<void> {
  try {
    await ensureBucket(bucket);
    await s3Client.putObject(bucket, key, content);
  } catch (error) {
    logger.error(error);
  }
}

export async function getFile(bucket: string, key: string): Promise<Readable> {
  try {
    return await s3Client.getObject(bucket, key);
  } catch (error) {
    logger.error(error);
  }
}

export async function deleteFile(bucket: string, key: string): Promise<void> {
  try {
    await s3Client.removeObject(bucket, key);
  } catch (error) {
    logger.error(error);
  }
}

export async function deleteFiles(bucket: string, keys: string[]): Promise<void> {
  try {
    await s3Client.removeObjects(bucket, keys);
  } catch (error) {
    logger.error(error);
  }
}
