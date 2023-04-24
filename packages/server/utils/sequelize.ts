import { FindOptions, Operator, operators } from '@appsemble/node-utils/server/types';
import { Op, WhereOptions } from 'sequelize';

export const parseWhereRecursively = ({ where }: Pick<FindOptions, 'where'>): WhereOptions => {
  const result = {} as any;
  for (const entry of Object.entries(where)) {
    const [key, value] = entry;
    if (operators.includes(key as Operator)) {
      result[Op[key as keyof typeof Op]] = parseWhereRecursively(value);
    } else {
      result[key] = parseWhereRecursively(value);
    }
  }
  return result;
};
