import { ActionType, EventType } from '@appsemble/types';

import { Methods } from '../db/methods.js';
import { FindOptions } from '../db/types.js';

const dir = 'blockVersions';

export class BlockVersion {
  id: number;
  name: string;
  version: string;

  layout?: 'float' | 'grow' | 'hidden' | 'static' | null;
  actions?: Record<string, ActionType>;

  events: {
    listen?: Record<string, EventType>;
    emit?: Record<string, EventType>;
  };

  OrganizationId: string;

  static findOne(query: FindOptions): Promise<BlockVersion | null> {
    return Methods.findOne(query, dir);
  }

  static findAll(query: FindOptions): Promise<BlockVersion[] | []> {
    return Methods.findAll(query, dir);
  }
}
