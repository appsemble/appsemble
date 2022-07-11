import { has } from '@appsemble/utils';
import { defaultParser, Token, TokenType } from '@odata/parser';
import { col, fn, json, Model, Op, Order, where, WhereOptions, WhereValue } from 'sequelize';
// eslint-disable-next-line import/no-unresolved
import { Col, Fn, Json, Where } from 'sequelize/types/utils';

type PartialModel = Pick<typeof Model, 'tableName'>;

enum Edm {
  null = 'null',
  Boolean = 'Edm.Boolean',
  Byte = 'Edm.Byte',
  Date = 'Edm.Date',
  DateTimeOffset = 'Edm.DateTimeOffset',
  Decimal = 'Edm.Decimal',
  Double = 'Edm.Double',
  Guid = 'Edm.Guid',
  Int16 = 'Edm.Int16',
  Int32 = 'Edm.Int32',
  Int64 = 'Edm.Int64',
  SByte = 'Edm.SByte',
  Single = 'Edm.Single',
  String = 'Edm.String',
}

/**
 * A function which accepts the name in the filter, and returns a name to replace it with.
 *
 * @param name The original name. This uses `/` as a separator.
 * @returns The new name to use instead.
 */
type Rename = (name: string) => string;

const defaultRename: Rename = (name) => name;

const operators = new Map([
  [TokenType.EqualsExpression, '='],
  [TokenType.LesserOrEqualsExpression, '<='],
  [TokenType.LesserThanExpression, '<'],
  [TokenType.GreaterOrEqualsExpression, '>='],
  [TokenType.GreaterThanExpression, '>'],
  [TokenType.NotEqualsExpression, '!='],
  [TokenType.AddExpression, '+'],
  [TokenType.SubExpression, '-'],
  [TokenType.DivExpression, '/'],
  [TokenType.MulExpression, '*'],
  [TokenType.ModExpression, '%'],
]);

type MethodConverter = [Edm[], (...args: any[]) => Fn | Where];

function whereFunction(op: symbol): (haystack: any, needle: any) => Where {
  return (haystack, needle) => where(haystack, { [op]: needle });
}

function fnFunction(name: string): (...args: any[]) => Fn {
  return (...args) => fn(name, ...args);
}

const functions: Record<string, MethodConverter> = {
  // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_concat
  contains: [[Edm.String, Edm.String], whereFunction(Op.substring)],

  // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_contains
  concat: [[Edm.String, Edm.String], fnFunction('concat')],

  // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_endswith
  endswith: [[Edm.String, Edm.String], whereFunction(Op.endsWith)],

  indexof: [[Edm.String, Edm.String], fnFunction('strpos')],

  // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_length
  length: [[Edm.String], fnFunction('length')],

  // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_startswith
  startswith: [[Edm.String, Edm.String], whereFunction(Op.startsWith)],

  // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_substring
  substring: [[Edm.String, Edm.SByte, Edm.SByte], fnFunction('substring')],

  // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_matchesPattern
  // This is currently not supported by the parser
  // https://github.com/Soontao/odata-v4-parser/issues/36
  matchesPattern: [[Edm.String, Edm.String], whereFunction(Op.iRegexp)],

  // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_tolower
  tolower: [[Edm.String], fnFunction('lower')],

  // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_toupper
  toupper: [[Edm.String], fnFunction('upper')],

  // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_trim
  trim: [[Edm.String], fnFunction('trim')],
};

function processLiteral(token: Token): Date | boolean | number | string {
  switch (token.value) {
    case Edm.Boolean:
      return token.raw === 'true';
    case Edm.String:
      return JSON.parse(`"${token.raw.slice(1, -1).replace(/"/g, '\\"')}"`);
    case Edm.Byte:
    case Edm.Decimal:
    case Edm.Double:
    case Edm.Int16:
    case Edm.Int32:
    case Edm.Int64:
    case Edm.SByte:
    case Edm.Single:
      return Number(token.raw);
    case Edm.Date:
    case Edm.DateTimeOffset:
      // The Date constructor will convert it to UTC.
      return new Date(token.raw);
    case Edm.Guid:
      return token.raw;
    case Edm.null:
      return null;
    default:
      throw new TypeError(`${token.position}: Unhandled OData literal type: ${token.value}`);
  }
}

function processName(token: Token, model: PartialModel, rename: Rename): Col | Json {
  // OData uses `/` as a path separator, but Sequelize uses `.`.
  // https://sequelize.org/master/manual/other-data-types.html#jsonb--postgresql-only-
  const name = rename(token.raw).replace(/\//g, '.');
  return name.includes('.') ? json(name) : col(`${model.tableName}.${name}`);
}

function processMethod(token: Token, model: PartialModel, rename: Rename): Fn | Where {
  const { method, parameters } = token.value as { method: string; parameters: Token[] };

  if (!has(functions, method)) {
    throw new TypeError(`${token.position}: Filter function not implemented: ${method}`);
  }
  const [parameterTypes, implementation] = functions[token.value.method];

  if (parameterTypes.length !== parameters.length) {
    throw new TypeError(
      `${token.position}: Expected ${parameterTypes.length} parameters, but got ${parameters.length}`,
    );
  }
  const parsedParameters = parameters.map((parameter, index) => {
    if (parameter.type === TokenType.FirstMemberExpression) {
      return processName(parameter, model, rename);
    }
    if (parameter.type === TokenType.Literal) {
      if (parameter.value !== parameterTypes[index]) {
        throw new TypeError(
          `${parameter.position}: Expected parameter of type ${parameterTypes[index]}, but got ${parameter.value}`,
        );
      }
      return processLiteral(parameter);
    }
    if (parameter.type === 'MethodCallExpression') {
      return processMethod(parameter, model, rename);
    }
    throw new TypeError(`${parameter.position}: Unhandled parameter type: ${parameter.type}`);
  });

  return implementation(...parsedParameters);
}

function processToken(
  token: Token,
  model: PartialModel,
  rename: Rename,
): WhereOptions | WhereValue {
  if (token.type === 'FirstMemberExpression') {
    return processName(token, model, rename) as WhereValue;
  }
  if (token.type === TokenType.MethodCallExpression) {
    return processMethod(token, model, rename);
  }
  if (token.type === TokenType.ParenExpression) {
    return processToken(token.value, model, rename);
  }
  if (operators.has(token.type)) {
    return where(
      processToken(token.value.left, model, rename),
      operators.get(token.type),
      processToken(token.value.right, model, rename),
    );
  }

  if (token.type === TokenType.Literal) {
    return processLiteral(token);
  }
  throw new TypeError(`${token.position}: Unhandled OData type: ${token.type}`);
}

/**
 * Process OData logical expressions:
 *
 * - `and`
 * - `or`
 * - `not`
 *
 * @param token The token to process.
 * @param model The model to do a query for.
 * @param rename A rename function.
 * @returns The Sequelize query that matches the given token.
 */
function processLogicalExpression(token: Token, model: PartialModel, rename: Rename): WhereOptions {
  if (token.type === TokenType.BoolParenExpression || token.type === TokenType.CommonExpression) {
    return processLogicalExpression(token.value, model, rename);
  }

  if (token.type === TokenType.NotExpression) {
    return { [Op.not]: processLogicalExpression(token.value, model, rename) };
  }

  const op =
    token.type === TokenType.AndExpression
      ? Op.and
      : token.type === TokenType.OrExpression
      ? Op.or
      : undefined;
  if (!op) {
    return processToken(token, model, rename) as WhereOptions;
  }
  const flatten = (expr: any): WhereOptions => (op in expr ? expr[op] : expr);
  const left = flatten(processLogicalExpression(token.value.left, model, rename));
  const right = flatten(processLogicalExpression(token.value.right, model, rename));
  return { [op]: [].concat(left).concat(right) };
}

/**
 * https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html
 *
 * @param query The OData query to convert to a Sequelize query.
 * @param model The model to do a query for.
 * @param rename A function for renaming incoming property names.
 * @returns The OData filter converted to a Sequelize query.
 */
export function odataFilterToSequelize(
  query: Token | string,
  model: PartialModel,
  rename: Rename = defaultRename,
): WhereOptions {
  if (!query) {
    return {};
  }
  const ast = typeof query === 'string' ? defaultParser.filter(query) : query;
  return processLogicalExpression(ast, model, rename);
}

export function odataOrderbyToSequelize(value: string, rename: Rename = defaultRename): Order {
  if (!value) {
    return [];
  }
  return value.split(/,/g).map((line) => {
    const [name, direction] = line.split(' ');
    return [rename(name), direction?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'];
  });
}
