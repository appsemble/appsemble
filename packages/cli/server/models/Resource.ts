import { type FindOptions } from '@appsemble/node-utils';

import { Methods } from '../db/methods.js';

const dir = '/resources';

export class Resource {
  id: number;
  $clonable: boolean;
  $created: string;
  $updated: string;

  [key: string]: unknown;

  static create(values: Record<string, unknown>, type: string): Promise<Resource | null> {
    return Methods.create({ ...values, type }, `${dir}/${type}[]`);
  }

  static bulkCreate(
    values: Record<string, unknown>[],
    type: string,
    override = false,
  ): Promise<Resource[] | []> {
    return Methods.bulkCreate(
      values.map((value) => ({ ...value, type })),
      `${dir}/${type}`,
      override,
    );
  }

  static findById(id: number | string, type: string): Promise<Resource | null> {
    return Methods.findById(id, `${dir}/${type}`);
  }

  static findAll(query: FindOptions, type: string): Promise<Resource[] | []> {
    return Methods.findAll(query, `${dir}/${type}`);
  }

  static updateOne(
    id: number | string,
    values: Record<string, unknown>,
    type: string,
  ): Promise<Resource | null> {
    return Methods.updateOne(id, values, `${dir}/${type}`);
  }

  static deleteOne(id: number | string, type: string): Promise<void> {
    return Methods.deleteOne(id, `${dir}/${type}`);
  }
}
