import { type FindOptions } from '@appsemble/node-utils';

import { db } from '../db/index.js';
import { Methods } from '../db/methods.js';

const dir = 'resources';

export class Resource {
  id: number;
  $clonable: boolean;
  $created: string;
  $updated: string;

  [key: string]: unknown;

  static create(values: Record<string, unknown>, type: string): Promise<Resource | null> {
    return Methods.create(db, values, `${dir}/${type}[]`);
  }

  static bulkCreate(
    values: Record<string, unknown>[],
    type: string,
    override = false,
  ): Promise<Resource[] | []> {
    return Methods.bulkCreate(db, values, `${dir}/${type}`, override);
  }

  static findById(id: number | string, type: string): Promise<Resource | null> {
    return Methods.findById(db, id, `${dir}/${type}`);
  }

  static findAll(query: FindOptions, type: string): Promise<Resource[] | []> {
    return Methods.findAll(db, query, `${dir}/${type}`);
  }

  static updateOne(
    id: number | string,
    values: Record<string, unknown>,
    type: string,
  ): Promise<Resource | null> {
    return Methods.updateOne(db, id, values, `${dir}/${type}`);
  }

  static deleteOne(id: number | string, type: string): Promise<void> {
    return Methods.deleteOne(db, id, `${dir}/${type}`);
  }
}
