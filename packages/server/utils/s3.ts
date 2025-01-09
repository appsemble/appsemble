import { type Readable } from 'node:stream';

import { Client } from 'minio';

let s3Client: Client;

export interface InitS3ClientParams {
  endPoint: string;
  port: number;
  useSSL?: boolean;
  accessKey: string;
  secretKey: string;
}

interface MinioError extends Error {
  code?: 'NoSuchKey';
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

export async function listBuckets(): Promise<void> {
  const buckets = await s3Client.listBuckets();
  console.log('minio buckets', buckets);
}

export async function assertBucket(name: string): Promise<void> {
  const bucketExists = await s3Client.bucketExists(name);
  if (!bucketExists) {
    await s3Client.makeBucket(name);
  }
}

export async function uploadFile(
  bucket: string,
  key: string,
  content: Buffer | Readable | string,
): Promise<void> {
  try {
    await s3Client.statObject(bucket, key);
  } catch (err) {
    const error = err as MinioError;
    if (error.code === 'NoSuchKey') {
      await s3Client.putObject(bucket, key, content);
    }
  }
}
