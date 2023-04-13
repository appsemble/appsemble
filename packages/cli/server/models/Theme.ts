import { FindOptions } from '@appsemble/node-utils/server/types.js';

import { Methods } from '../db/methods.js';

const dir = 'themes';

export class Theme {
  bulmaVersion: string;
  primaryColor: string;
  linkColor: string;
  successColor: string;
  infoColor: string;
  warningColor: string;
  dangerColor: string;
  themeColor: string;
  splashColor: string;
  fontFamily: string;
  fontSource: string;
  css: string;

  static create(values: Record<string, unknown>): Promise<Theme | null> {
    return Methods.create(values, dir);
  }

  static findOne(query: FindOptions): Promise<Theme | null> {
    return Methods.findOne(query, dir);
  }
}
