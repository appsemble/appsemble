import { Op } from 'sequelize';

export function mapKeysRecursively(obj: any): any {
  if (typeof obj !== 'object' || obj == null) {
    return obj;
  }

  // eslint-disable-next-line eqeqeq
  if (obj.attribute && obj.comparator && (obj.logic || obj.logic === null)) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((value) => mapKeysRecursively(value));
  }

  const result: Record<string | symbol, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = Op[key as keyof typeof Op] || key;
    result[newKey as PropertyKey] = mapKeysRecursively(value);
  }

  // Sequelize operator objects built upstream (e.g. by the OData parser) use
  // `Op.*` Symbol keys which Object.entries skips. Preserve them verbatim —
  // they are already in the form Sequelize expects.
  for (const sym of Object.getOwnPropertySymbols(obj)) {
    result[sym] = mapKeysRecursively((obj as any)[sym]);
  }

  return result;
}
