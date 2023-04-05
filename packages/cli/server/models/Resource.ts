import { Methods } from '../db/methods.js';
import { FindOptions } from '../db/types.js';

const dir = 'resources';

export class Resource {
  id: number;
  $clonable: boolean;
  $created: string;
  $updated: string;

  [key: string]: unknown;

  static create(values: Record<string, unknown>, type: string): Promise<Resource | null> {
    return Methods.create(values, `${dir}/${type}[]`);
  }

  static bulkCreate(values: Record<string, unknown>[], type: string): Promise<Resource | null> {
    return Methods.bulkCreate(values, `${dir}/${type}`);
  }

  static findById(id: number | string, type: string): Promise<Resource | null> {
    return Methods.findById(id, `${dir}/${type}`);
  }

  static findAll(query: FindOptions, type: string): Promise<Resource[] | []> {
    return Methods.findAll(query, `${dir}/${type}`);
  }
}
