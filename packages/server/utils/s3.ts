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

export async function listBuckets(): Promise<void> {
  const buckets = await s3Client.listBuckets();
  console.log('minio buckets', buckets);
}
