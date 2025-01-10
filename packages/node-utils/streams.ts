import { type Readable } from 'node:stream';

import { streamToBuffer as sToBuffer } from 'memfs/lib/node/util.js';

export function streamToBuffer(stream: Readable): Promise<Buffer> {
  return sToBuffer(stream);
}
