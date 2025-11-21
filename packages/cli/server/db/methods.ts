import { type FindOptions, type OrderItem } from '@appsemble/node-utils';

import { getDb } from './index.js';

interface ResourceDefaults {
  AppId: number;
  AuthorId: number;
  $created: Date;
  $updated: Date;
  expires: Date | null;
}

const defaults: ResourceDefaults = {
  AppId: 1,
  AuthorId: 1,
  $created: new Date(),
  $updated: new Date(),
  expires: null,
};

let appName = 'app';

export function setAppName(name: string): void {
  appName = name;
}

type Comparator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
type Expression = 'and' | 'or';

function parseValue(value: string): Date | boolean | number | string {
  const toNumber = Number(value);
  if (!Number.isNaN(toNumber)) {
    return toNumber;
  }

  const toDate = Date.parse(value);
  if (!Number.isNaN(toDate)) {
    return toDate;
  }

  if (value === 'false' || value === 'true') {
    return Boolean(value);
  }

  return value;
}

function applyQuery<M>(
  entity: M,
  key: string,
  query: Record<Comparator | Expression, string> | string,
): boolean {
  if (query == null && entity[key as keyof M] == null) {
    return true;
  }

  if (query === undefined && entity[key as keyof M] === undefined) {
    return true;
  }

  const parsedEntityValue = parseValue(entity[key as keyof M] as string);

  if (typeof query === 'string') {
    return parsedEntityValue === parseValue(query as string);
  }

  if (query.or && Array.isArray(query.or)) {
    return query.or.some((subQuery: Record<Comparator | string, any>) =>
      applyQuery(entity, key, subQuery),
    );
  }

  if (query.and && Array.isArray(query.and)) {
    return query.and.every((subQuery: Record<Comparator | string, any>) =>
      applyQuery(entity, key, subQuery),
    );
  }

  if (query.gt) {
    return parsedEntityValue > parseValue(query.gt);
  }

  if (query.gte) {
    return parsedEntityValue >= parseValue(query.gte);
  }

  if (query.lt) {
    return parsedEntityValue < parseValue(query.lt);
  }

  if (query.lte) {
    return parsedEntityValue <= parseValue(query.lte);
  }

  if (query.eq || query.eq === '') {
    return parsedEntityValue === parseValue(query.eq);
  }

  if (query.eq == null && entity[key as keyof M] === undefined) {
    return true;
  }

  if (query.ne || query.ne === '') {
    return parsedEntityValue !== parseValue(query.ne);
  }

  return entity[key as keyof M] === query;
}

function checkOr<M>(entity: M, or: Record<Expression | string, unknown>[]): boolean {
  return or.some((subQuery) => {
    if (subQuery.or) {
      return checkOr(entity, subQuery.or as []);
    }

    if (subQuery.and) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return checkAnd(entity, subQuery.and as []);
    }

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return checkEntity(entity, subQuery);
  });
}

function checkAnd<M>(entity: M, and: Record<Expression | string, unknown>[]): boolean {
  return and.every((subQuery) => {
    if (subQuery.or) {
      return checkOr(entity, subQuery.or as []);
    }

    if (subQuery.and) {
      return checkAnd(entity, subQuery.and as []);
    }

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return checkEntity(entity, subQuery);
  });
}

function checkEntity<M>(entity: M, query: Record<Expression | string, any>): boolean {
  if (query.or && Array.isArray(query.or)) {
    return checkOr(entity, query.or);
  }

  if (query.and && Array.isArray(query.and)) {
    return checkAnd(entity, query.and);
  }

  return Object.entries(query).every(([key, value]) => applyQuery(entity, key, value));
}

function applyAttributes<M>(entities: M[], attributes: string[]): M[] {
  return entities.map((entity) => {
    const result = {} as M;
    for (const attribute of attributes) {
      if (entity[attribute as keyof M] !== undefined) {
        result[attribute as keyof M] = entity[attribute as keyof M];
      }
    }
    return result;
  });
}

function applyOrder<M>(entities: M[], order: OrderItem[]): void {
  for (const orderItem of order) {
    entities.sort((a, b) => {
      const [property, direction] = orderItem;
      if (a[property as keyof typeof a] > b[property as keyof typeof b]) {
        return direction === 'DESC' ? -1 : 1;
      }

      if (a[property as keyof typeof a] < b[property as keyof typeof b]) {
        return direction === 'DESC' ? 1 : -1;
      }

      return 0;
    });
  }
}

function clearEntity(entity: Record<string, unknown>): Record<string, unknown> {
  const { AppId, AuthorId, type, ...cleanPayload } = entity;

  if (!cleanPayload.expires) {
    delete cleanPayload.expires;
  }

  return cleanPayload;
}

export const Methods = {
  async create<M>(values: Record<string, unknown>, modelDir = '/'): Promise<M> {
    const db = await getDb(appName);
    const existing = await this.findAll({}, modelDir);
    const payload = {
      ...values,
      id: existing.length + 1,
      ...defaults,
    };
    await db.push(modelDir, payload, true);
    return clearEntity(payload) as M;
  },

  async bulkCreate<M>(
    values: Record<string, unknown>[],
    modelDir = '/',
    override = false,
  ): Promise<M[] | []> {
    const db = await getDb(appName);
    const existing = await this.findAll({}, modelDir);
    const payload = values.map((value, index) => ({
      ...value,
      id: existing.length + index + 1,
      ...defaults,
    }));
    await db.push(modelDir, payload, existing.length === 0 ? true : override);
    return payload.map((instance) => clearEntity(instance)) as M[];
  },

  async findById<M>(id: number | string, modelDir = '/'): Promise<M | null> {
    try {
      const db = await getDb(appName);
      const entityIndex = await db.getIndex(modelDir, id);
      return await db.getObject<M>(`${modelDir}[${entityIndex}]`);
    } catch {
      return null;
    }
  },

  async findOne<M>(query: FindOptions, modelDir = '/'): Promise<M | null> {
    try {
      const db = await getDb(appName);
      const entities = await db.getObject<M[]>(modelDir);

      let mapped = entities;
      if (query.attributes && query.attributes.length > 0) {
        mapped = applyAttributes(mapped, query.attributes);
      }

      let filtered = mapped;

      if (query.where) {
        filtered = filtered.filter((entity) => checkEntity(entity, query.where!));
      }

      const sorted = filtered;
      if (query.order) {
        applyOrder(sorted, query.order);
      }

      return (clearEntity(sorted[0] as Record<string, unknown>) as M) || null;
    } catch {
      return null;
    }
  },

  async findAll<M>(query: FindOptions = {}, modelDir = '/'): Promise<M[] | []> {
    try {
      const db = await getDb(appName);
      const entities = await db.getObject<M[]>(modelDir);

      const sliced = entities.slice(
        query.offset || 0,
        ((query.limit ? query.limit - 1 + (query.offset || 0) : 0) || entities.length) + 1,
      );

      let mapped = sliced;
      if (query.attributes && query.attributes.length > 0) {
        mapped = applyAttributes(mapped, query.attributes);
      }

      let filtered = mapped;

      if (query.where) {
        filtered = filtered.filter((entity) => checkEntity(entity, query.where!));
      }

      const sorted = filtered;
      if (query.order) {
        applyOrder(sorted, query.order);
      }

      return sorted.map((instance) => clearEntity(instance as Record<string, unknown>) as M);
    } catch {
      return [];
    }
  },

  async updateOne<M>(
    id: number | string,
    values: Record<string, unknown>,
    modelDir = '/',
  ): Promise<M> {
    try {
      const db = await getDb(appName);
      const entityIndex = await db.getIndex(modelDir, id);
      const existing = await this.findById<M>(id, modelDir);
      await db.push(`${modelDir}[${entityIndex}]`, { ...existing, ...values }, true);
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      return this.findOne<M>({ where: values }, modelDir);
    } catch {
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      return null;
    }
  },

  async deleteOne(id: number | string, modelDir = '/'): Promise<void> {
    try {
      const db = await getDb(appName);
      const entityIndex = await db.getIndex(modelDir, id);
      return await db.delete(`${modelDir}[${entityIndex}]`);
    } catch {
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      return null;
    }
  },
};
