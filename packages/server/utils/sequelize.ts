import { Op } from 'sequelize';

export function mapKeysRecursively(obj: any): any {
  if (typeof obj !== 'object' || obj == null) {
    return obj;
  }

  if (obj.attribute && obj.comparator && obj.logic) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((value) => mapKeysRecursively(value));
  }

  let result = obj as Record<string, any>;

  for (const entry of Object.entries(obj)) {
    const [key, value] = entry;
    const newKey = Op[key as keyof typeof Op] || key;
    delete result[key];
    result = {
      ...result,
      [newKey]: mapKeysRecursively(value),
    };
  }

  return result;
}
