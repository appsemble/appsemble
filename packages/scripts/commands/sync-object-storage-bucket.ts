import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';

import {
  getBlockAssetLocation,
  getS3File,
  initS3Client,
  isValidBlockAssetFilename,
  listS3Files,
  logger,
  setS3BucketPolicy,
  uploadS3File,
} from '@appsemble/node-utils';
import { type Argv } from 'yargs';

interface SyncObjectStorageBucketArguments {
  direction: 'export' | 'import';
  directory: string;
  publicRead?: boolean;
  s3AccessKey: string;
  s3Bucket?: string;
  s3Host: string;
  s3PathStyle: boolean;
  s3Port: number;
  s3Region: string;
  s3SecretKey: string;
  s3Secure: boolean;
}

interface StoredObjectMetadata {
  metadata: Record<string, string>;
}

const metadataFilename = 'metadata.json';
const objectsDirectoryName = 'objects';

export const command = 'sync-object-storage-bucket <direction> <directory>';
export const description =
  'Export or import the block assets of an S3 compatible object storage server.';

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

/**
 * @returns The bucket and key prefix that hold every block asset in the configured layout.
 */
function getBlockAssetsRoot(): { bucket: string; prefix: string } {
  const { bucket, key } = getBlockAssetLocation('');
  return { bucket, prefix: key };
}

async function exportBlockAssets(directory: string): Promise<void> {
  const objectsDirectory = join(directory, objectsDirectoryName);
  const metadata: Record<string, StoredObjectMetadata> = {};
  const { bucket, prefix } = getBlockAssetsRoot();
  const files = await listS3Files(bucket, prefix || undefined);
  const unsafeFile = files.find(({ key }) => !isValidBlockAssetFilename(key.slice(prefix.length)));

  if (unsafeFile) {
    throw new Error(`Unsafe object storage key: ${unsafeFile.key}`);
  }

  await rm(directory, { force: true, recursive: true });
  await mkdir(objectsDirectory, { recursive: true });

  for (const file of files) {
    const storageKey = file.key.slice(prefix.length);
    const target = join(objectsDirectory, ...storageKey.split('/'));

    await mkdir(dirname(target), { recursive: true });
    await pipeline(await getS3File(bucket, file.key), createWriteStream(target));
    metadata[storageKey] = {
      metadata: Object.fromEntries(
        Object.entries(file.metadata).map(([key, value]) => [key, String(value)]),
      ),
    };
  }

  await writeFile(join(directory, metadataFilename), JSON.stringify(metadata, null, 2));
  logger.info(`Exported ${files.length} block asset(s) from ${bucket}/${prefix}.`);
}

async function importBlockAssets(directory: string, publicRead?: boolean): Promise<void> {
  const objectsDirectory = join(directory, objectsDirectoryName);
  const metadata = JSON.parse(await readFile(join(directory, metadataFilename), 'utf8')) as Record<
    string,
    StoredObjectMetadata | undefined
  >;
  const { bucket, prefix } = getBlockAssetsRoot();
  let count = 0;

  for await (const path of walkFiles(objectsDirectory)) {
    const storageKey = relative(objectsDirectory, path).split(sep).join('/');
    const { key } = getBlockAssetLocation(storageKey);
    const { size } = await stat(path);

    await uploadS3File(bucket, key, createReadStream(path), size, metadata[storageKey]?.metadata);
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
            Resource: [`arn:aws:s3:::${bucket}/${prefix}*`],
          },
        ],
      }),
    );
  }

  logger.info(`Imported ${count} block asset(s) into ${bucket}/${prefix}.`);
}

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .positional('direction', {
      choices: ['export', 'import'],
      describe:
        'Whether to export the block assets to a directory or import them from a directory.',
      type: 'string',
    })
    .positional('directory', {
      describe: 'The directory to export to or import from.',
      type: 'string',
    })
    .option('public-read', {
      default: false,
      describe: 'Whether to make the imported block assets publicly readable.',
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
    })
    .option('s3-bucket', {
      default: process.env.S3_BUCKET,
      describe:
        'The single, pre-provisioned bucket that holds all objects. When set, block assets live under its blocks/ prefix; when unset, they live in the appsemble-block-assets bucket.',
      type: 'string',
    })
    .option('s3-region', {
      default: process.env.S3_REGION ?? 'us-east-1',
      describe: 'The region to sign requests to the S3 compatible object storage server for.',
      type: 'string',
    })
    .option('s3-path-style', {
      default: parseBoolean(process.env.S3_PATH_STYLE, true),
      describe: 'Whether to address buckets in the URL path instead of as a subdomain of the host.',
      type: 'boolean',
    });
}

export async function handler({
  direction,
  directory,
  publicRead,
  s3AccessKey,
  s3Bucket,
  s3Host,
  s3PathStyle,
  s3Port,
  s3Region,
  s3SecretKey,
  s3Secure,
}: SyncObjectStorageBucketArguments): Promise<void> {
  initS3Client({
    accessKey: s3AccessKey,
    bucket: s3Bucket,
    endPoint: s3Host,
    pathStyle: s3PathStyle,
    port: s3Port,
    region: s3Region,
    secretKey: s3SecretKey,
    useSSL: s3Secure,
  });

  if (direction === 'export') {
    await exportBlockAssets(directory);
    return;
  }

  await importBlockAssets(directory, publicRead);
}
