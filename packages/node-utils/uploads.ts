import { createReadStream } from 'node:fs';
import { unlink } from 'node:fs/promises';

import { streamToBuffer } from 'memfs/lib/node/util.js';

import { logger } from './logger.js';

// XXX: a bit severe
// @ts-expect-error 2366 - Function lacks ending return statement and return type does not include 'undefined'
export async function uploadToBuffer(path: string): Promise<Buffer> {
  try {
    const buffer = await streamToBuffer(await createReadStream(path));
    await unlink(path);
    return buffer;
  } catch (error) {
    logger.error(error);
  }
}

export async function removeUploads(paths: string[]): Promise<void> {
  for (const path of paths) {
    try {
      await unlink(path);
    } catch (error) {
      logger.error(error);
    }
  }
}
