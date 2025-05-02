import { Edm, processLiteral } from '@appsemble/node-utils';
import { type ResourceDefinition } from '@appsemble/types';
import { has } from '@appsemble/utils';
import { defaultParser, type Token, TokenType } from '@odata/parser';
import { OpenAPIV3 } from 'openapi-types';
import {
  col,
  fn,
  json,
  Op,
  type Order,
  where,
  type WhereOptions,
  type WhereValue,
} from 'sequelize';
import { type Col, type Fn, type Json, type Literal, type Where } from 'sequelize/types/utils';

import SchemaObject = OpenAPIV3.SchemaObject;

export type FieldType = 'boolean' | 'date' | 'integer' | 'number' | 'string';

/**
 * A function which accepts the name in the filter, and returns a name to replace it with.
 *
 * @param name The original name. This uses `/` as a separator.
 * @returns The new name to use instead.
 */
type Rename = (name: string) => string;

/**
 * A function which accepts the name in the filter, and returns a name to replace it with.
 *
 * @param name The original name. This uses `/` as a separator.
 * @param type The type of the field in the resource data.
 * @returns The new name to use instead.
 */
type RenameWithCasting = (name: string, type?: FieldType) => Literal | string;

const defaultRename: Rename = (name) => name;

const defaultRenameWithCasting: RenameWithCasting = (name) => name;

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

function processName(token: Token, tableName: string, rename: Rename): Col | Json {
  // OData uses `/` as a path separator, but Sequelize uses `.`.
  // https://sequelize.org/master/manual/other-data-types.html#jsonb--postgresql-only-
  const name = rename(token.raw).replaceAll('/', '.');
  return name.includes('.') ? json(name) : col(`${tableName}.${name}`);
}

function processMethod(token: Token, tableName: string, rename: Rename): Fn | Where {
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
      return processName(parameter, tableName, rename);
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
      return processMethod(parameter, tableName, rename);
    }
    throw new TypeError(`${parameter.position}: Unhandled parameter type: ${parameter.type}`);
  });

  return implementation(...parsedParameters);
}

function processToken(token: Token, tableName: string, rename: Rename): WhereOptions | WhereValue {
  if (token.type === 'FirstMemberExpression') {
    return processName(token, tableName, rename) as WhereValue;
  }
  if (token.type === TokenType.MethodCallExpression) {
    return processMethod(token, tableName, rename);
  }
  if (token.type === TokenType.ParenExpression) {
    return processToken(token.value, tableName, rename);
  }
  if (operators.has(token.type)) {
    return where(
      processToken(token.value.left, tableName, rename),
      operators.get(token.type)!,
      processToken(token.value.right, tableName, rename),
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
 * @param tableName The name of the table to do a query for.
 * @param rename A rename function.
 * @returns The Sequelize query that matches the given token.
 */
function processLogicalExpression(token: Token, tableName: string, rename: Rename): WhereOptions {
  if (token.type === TokenType.BoolParenExpression || token.type === TokenType.CommonExpression) {
    return processLogicalExpression(token.value, tableName, rename);
  }

  if (token.type === TokenType.NotExpression) {
    return { [Op.not]: processLogicalExpression(token.value, tableName, rename) };
  }

  const op =
    token.type === TokenType.AndExpression
      ? Op.and
      : token.type === TokenType.OrExpression
        ? Op.or
        : undefined;
  if (!op) {
    return processToken(token, tableName, rename) as WhereOptions;
  }
  const flatten = (expr: any): WhereOptions => (op in expr ? expr[op] : expr);
  const left = flatten(processLogicalExpression(token.value.left, tableName, rename));
  const right = flatten(processLogicalExpression(token.value.right, tableName, rename));
  return { [op]: ([] as WhereOptions[]).concat(left).concat(right) };
}

/**
 * https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html
 *
 * @param query The OData query to convert to a Sequelize query.
 * @param tableName The name of the table to parse the query for.
 * @param rename A function for renaming incoming property names.
 * @returns The OData filter converted to a Sequelize query.
 */
export function odataFilterToSequelize(
  query: Token | string,
  tableName: string,
  rename: Rename = defaultRename,
): WhereOptions {
  if (!query) {
    return {};
  }
  const ast = typeof query === 'string' ? defaultParser.filter(query) : query;
  return processLogicalExpression(ast, tableName, rename);
}

export function odataOrderbyToSequelize(
  value: string,
  rename: RenameWithCasting = defaultRenameWithCasting,
  resourceDefinition?: ResourceDefinition,
): Order {
  if (!value) {
    return [];
  }
  return value.split(/,/g).map((line) => {
    const [name, direction] = line.split(' ');

    const resourceDefinitionProperty = resourceDefinition?.schema?.properties?.[
      name
    ] as SchemaObject;

    const definitionType = resourceDefinitionProperty?.type;
    const definitionFormat = resourceDefinitionProperty?.format;
    const definitionEnum = resourceDefinitionProperty?.enum;

    let type;
    if (definitionType && !['array', 'object'].includes(definitionType)) {
      type = definitionType;

      if (definitionFormat === 'date') {
        type = 'date';
      }
    }

    if (definitionEnum) {
      type = 'string';
    }

    return [rename(name, type as FieldType), direction?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'];
  });
}
