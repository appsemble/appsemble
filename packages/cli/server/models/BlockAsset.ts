import { Methods } from '../db/methods.js';
import { FindOptions } from '../db/types.js';

const dir = 'blockAssets';

export class BlockAsset {
  id: number;
  content: Buffer;
  filename: string;
  mime: string;

  BlockVersionId: string;

  static findOne(query: FindOptions): Promise<BlockAsset | null> {
    return Methods.findOne(query, dir);
  }
}
