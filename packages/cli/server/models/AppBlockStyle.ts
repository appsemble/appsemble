import { Methods } from '../db/methods.js';
import { FindOptions } from '../db/types.js';

const dir = '/appBlockStyles';

export class AppBlockStyle {
  AppId: string;
  /**
   * This refers to the organization and name of a block
   * it is agnostic of the version of the block.
   *
   * Format: @organizationName/blockName
   */
  block: string;
  style: string;

  static findAll(query: FindOptions): Promise<AppBlockStyle[] | []> {
    return Methods.findAll(query, dir);
  }
}
