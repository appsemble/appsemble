import { Methods } from '../db/methods.js';
import { FindOptions } from '../db/types.js';

const dir = '/appScreenshots';

export class AppScreenshot {
  AppId: string;
  id: number;
  mime: string;
  screenshot: Buffer;
  width: number;
  height: number;

  static findAll(query: FindOptions): Promise<AppScreenshot[] | []> {
    return Methods.findAll(query, dir);
  }
}
