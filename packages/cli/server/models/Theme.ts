import { type FindOptions } from '@appsemble/node-utils';

import { Methods } from '../db/methods.js';

const dir = '/themes';

export class Theme {
  // @ts-expect-error 2567 No initializer and not assigned in constructor
  bulmaVersion: string;

  // @ts-expect-error 2567 No initializer and not assigned in constructor
  primaryColor: string;

  // @ts-expect-error 2567 No initializer and not assigned in constructor
  linkColor: string;

  // @ts-expect-error 2567 No initializer and not assigned in constructor
  successColor: string;

  // @ts-expect-error 2567 No initializer and not assigned in constructor
  infoColor: string;

  // @ts-expect-error 2567 No initializer and not assigned in constructor
  warningColor: string;

  // @ts-expect-error 2567 No initializer and not assigned in constructor
  dangerColor: string;

  // @ts-expect-error 2567 No initializer and not assigned in constructor
  themeColor: string;

  // @ts-expect-error 2567 No initializer and not assigned in constructor
  splashColor: string;

  // @ts-expect-error 2567 No initializer and not assigned in constructor
  fontFamily: string;

  // @ts-expect-error 2567 No initializer and not assigned in constructor
  fontSource: string;

  // @ts-expect-error 2567 No initializer and not assigned in constructor
  css: string;

  static create(values: Record<string, unknown>): Promise<Theme | null> {
    return Methods.create(values, dir);
  }

  static findOne(query: FindOptions): Promise<Theme | null> {
    return Methods.findOne(query, dir);
  }
}
