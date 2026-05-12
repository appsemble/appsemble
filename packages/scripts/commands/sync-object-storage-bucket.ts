import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';

import {
  getS3File,
  initS3Client,
  listS3Files,
  logger,
  setS3BucketPolicy,
  uploadS3File,
} from '@appsemble/node-utils';
import { type Argv } from 'yargs';

interface SyncObjectStorageBucketArguments {
  bucket: string;
  direction: 'export' | 'import';
  directory: string;
  publicRead?: boolean;
  s3AccessKey: string;
  s3Host: string;
  s3Port: number;
  s3SecretKey: string;
  s3Secure: boolean;
}

interface StoredObjectMetadata {
  metadata: Record<string, string>;
}

const metadataFilename = 'metadata.json';
const objectsDirectoryName = 'objects';

export const command = 'sync-object-storage-bucket <direction> <directory>';
export const description = 'Export or import an S3 compatible object storage bucket.';

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null) {
    return defaultValue;
  }

  return value.toLowerCase() === 'true';
}

async function* walkFiles(directory: string): AsyncGenerator<string> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      yield* walkFiles(path);
    } else if (entry.isFile()) {
      yield path;
    }
  }
}

async function exportBucket(bucket: string, directory: string): Promise<void> {
  const bucketDirectory = join(directory, bucket);
  const objectsDirectory = join(bucketDirectory, objectsDirectoryName);
  const metadata: Record<string, StoredObjectMetadata> = {};
  const files = await listS3Files(bucket);

  await mkdir(objectsDirectory, { recursive: true });

  for (const file of files) {
    const target = join(objectsDirectory, ...file.key.split('/'));

    await mkdir(dirname(target), { recursive: true });
    await pipeline(await getS3File(bucket, file.key), createWriteStream(target));
    metadata[file.key] = {
      metadata: Object.fromEntries(
        Object.entries(file.metadata).map(([key, value]) => [key, String(value)]),
      ),
    };
  }

  await writeFile(join(bucketDirectory, metadataFilename), JSON.stringify(metadata, null, 2));
  logger.info(`Exported ${files.length} object(s) from ${bucket}.`);
}

async function importBucket(
  bucket: string,
  directory: string,
  publicRead?: boolean,
): Promise<void> {
  const bucketDirectory = join(directory, bucket);
  const objectsDirectory = join(bucketDirectory, objectsDirectoryName);
  const metadata = JSON.parse(
    await readFile(join(bucketDirectory, metadataFilename), 'utf8'),
  ) as Record<string, StoredObjectMetadata | undefined>;
  let count = 0;

  for await (const path of walkFiles(objectsDirectory)) {
    const key = relative(objectsDirectory, path).split(sep).join('/');
    const { size } = await stat(path);

    await uploadS3File(bucket, key, createReadStream(path), size, metadata[key]?.metadata);
    count += 1;
  }

  if (publicRead) {
    await setS3BucketPolicy(
      bucket,
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucket}/*`],
          },
        ],
      }),
    );
  }

  logger.info(`Imported ${count} object(s) into ${bucket}.`);
}

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .positional('direction', {
      choices: ['export', 'import'],
      describe: 'Whether to export the bucket to a directory or import it from a directory.',
      type: 'string',
    })
    .positional('directory', {
      describe: 'The directory to export to or import from.',
      type: 'string',
    })
    .option('bucket', {
      default: 'appsemble-block-assets',
      describe: 'The bucket to synchronize.',
      type: 'string',
    })
    .option('public-read', {
      default: false,
      describe: 'Whether to make the imported bucket publicly readable.',
      type: 'boolean',
    })
    .option('s3-host', {
      default: process.env.S3_HOST ?? 'localhost',
      describe: 'The host of the S3 compatible object storage server.',
      type: 'string',
    })
    .option('s3-port', {
      default: Number(process.env.S3_PORT ?? 9000),
      describe: 'The port of the S3 compatible object storage server.',
      type: 'number',
    })
    .option('s3-secure', {
      default: parseBoolean(process.env.S3_SECURE, true),
      describe: 'Whether SSL should be used for the S3 compatible object storage server.',
      type: 'boolean',
    })
    .option('s3-access-key', {
      default: process.env.S3_ACCESS_KEY,
      demandOption: true,
      describe: 'The access key of the S3 compatible object storage server.',
      type: 'string',
    })
    .option('s3-secret-key', {
      default: process.env.S3_SECRET_KEY,
      demandOption: true,
      describe: 'The secret key of the S3 compatible object storage server.',
      type: 'string',
    });
}

export async function handler({
  bucket,
  direction,
  directory,
  publicRead,
  s3AccessKey,
  s3Host,
  s3Port,
  s3SecretKey,
  s3Secure,
}: SyncObjectStorageBucketArguments): Promise<void> {
  initS3Client({
    accessKey: s3AccessKey,
    endPoint: s3Host,
    port: s3Port,
    secretKey: s3SecretKey,
    useSSL: s3Secure,
  });

  if (direction === 'export') {
    await exportBucket(bucket, directory);
    return;
  }

  await importBucket(bucket, directory, publicRead);
}
