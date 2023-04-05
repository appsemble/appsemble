import { AppsembleMessages } from '@appsemble/types';

import { Methods } from '../db/methods.js';
import { FindOptions } from '../db/types.js';

const dir = 'appMessages';

export class AppMessages {
  AppId: string;
  language: string;
  messages: AppsembleMessages;

  static findAll(query: FindOptions): Promise<AppMessages[] | []> {
    return Methods.findAll(query, dir);
  }
}
