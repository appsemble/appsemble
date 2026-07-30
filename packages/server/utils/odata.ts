import { type ResourceDefinition } from '@appsemble/lang-sdk';
import { Edm, processLiteral } from '@appsemble/node-utils';
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

/**
 * OData literal types which may be used as the scalar value of a JSONB containment expression.
 *
 * `Edm.null` is excluded because containment cannot express a null/missing check. Dates and GUIDs
 * are excluded to keep their text-based comparison semantics.
 */
const containmentLiteralTypes = new Set<unknown>([
  Edm.Boolean,
  Edm.Byte,
  Edm.Decimal,
  Edm.Double,
  Edm.Int16,
  Edm.Int32,
  Edm.Int64,
  Edm.SByte,
  Edm.Single,
  Edm.String,
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

/**
 * Translate an equality comparison between a path into a JSONB column and a scalar literal into a
 * query the GIN index on the column can answer.
 *
 * The plain text extraction comparison `("data"#>>'{foo}') = 'bar'` cannot use a GIN index, so
 * PostgreSQL extracts and compares text for every row of the bitmap scan. A containment
 * expression such as `"Resource"."data" @> '{"foo":"bar"}'` is answered through the index.
 *
 * For a number or boolean literal the text extraction comparison is invalid SQL (`text = 12`
 * has no operator), so the type-exact containment expression is the only working translation.
 *
 * A string literal keeps the text extraction comparison for exact semantics: it also matches
 * rows where the stored value is a number or boolean whose text rendering equals the literal
 * (e.g. `'123'` matches the stored number `123`). That comparison is AND-ed with a containment
 * disjunction covering every JSON value the literal can render from, so the index prunes the
 * candidate rows without ever changing the result.
 *
 * @param token The equals expression token to process.
 * @param tableName The name of the table to do a query for.
 * @param rename A rename function.
 * @param jsonbColumns Names of JSONB columns for which containment may be used.
 * @returns The index enabled equality expression, or undefined if the comparison is not an
 *   equality between a path into one of `jsonbColumns` and a scalar literal.
 */
function processContainment(
  token: Token,
  tableName: string,
  rename: Rename,
  jsonbColumns: string[],
): Where | WhereOptions | undefined {
  const { left, right } = token.value as { left: Token; right: Token };
  let propertyToken: Token;
  let literalToken: Token;
  if (left.type === TokenType.FirstMemberExpression && right.type === TokenType.Literal) {
    propertyToken = left;
    literalToken = right;
  } else if (right.type === TokenType.FirstMemberExpression && left.type === TokenType.Literal) {
    propertyToken = right;
    literalToken = left;
  } else {
    return;
  }
  if (!containmentLiteralTypes.has(literalToken.value)) {
    return;
  }
  const [column, ...path] = rename(propertyToken.raw).replaceAll('/', '.').split('.');
  if (!path.length || !jsonbColumns.includes(column)) {
    return;
  }

  const value = processLiteral(literalToken);
  const contain = (scalar: unknown): Where => {
    let nested = scalar;
    for (let index = path.length - 1; index >= 0; index -= 1) {
      nested = { [path[index]]: nested };
    }
    return where(col(`${tableName}.${column}`), { [Op.contains]: JSON.stringify(nested) });
  };

  if (literalToken.value !== Edm.String) {
    return contain(value);
  }

  const textComparison = where(
    processName(propertyToken, tableName, rename) as WhereValue,
    '=',
    value,
  );
  const variants = [contain(value)];
  try {
    const parsed = JSON.parse(value as string);
    if (typeof parsed === 'number' && JSON.stringify(parsed) !== value) {
      return textComparison;
    }
    if (typeof parsed !== 'string') {
      variants.push(contain(parsed));
    }
  } catch {
    // The literal is not the text rendering of any non-string JSON value, so the string
    // containment variant covers everything the text extraction comparison can match.
  }
  return {
    [Op.and]: [textComparison, variants.length > 1 ? { [Op.or]: variants } : variants[0]],
  };
}

function processToken(
  token: Token,
  tableName: string,
  rename: Rename,
  jsonbColumns: string[],
  negated: boolean,
): WhereOptions | WhereValue {
  if (token.type === 'FirstMemberExpression') {
    return processName(token, tableName, rename) as WhereValue;
  }
  if (token.type === TokenType.MethodCallExpression) {
    return processMethod(token, tableName, rename);
  }
  if (token.type === TokenType.ParenExpression) {
    return processToken(token.value, tableName, rename, jsonbColumns, negated);
  }
  if (operators.has(token.type)) {
    // A negated containment expression also matches rows where the path is absent, whereas a
    // negated text extraction comparison evaluates to null for those rows and matches nothing, so
    // containment only applies outside negations.
    if (token.type === TokenType.EqualsExpression && !negated) {
      const containment = processContainment(token, tableName, rename, jsonbColumns);
      if (containment) {
        return containment;
      }
    }
    return where(
      processToken(token.value.left, tableName, rename, jsonbColumns, negated),
      operators.get(token.type)!,
      processToken(token.value.right, tableName, rename, jsonbColumns, negated),
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
 * @param jsonbColumns Names of JSONB columns for which containment may be used.
 * @param negated Whether the token is nested in an odd number of `not` expressions.
 * @returns The Sequelize query that matches the given token.
 */
function processLogicalExpression(
  token: Token,
  tableName: string,
  rename: Rename,
  jsonbColumns: string[],
  negated: boolean,
): WhereOptions {
  if (token.type === TokenType.BoolParenExpression || token.type === TokenType.CommonExpression) {
    return processLogicalExpression(token.value, tableName, rename, jsonbColumns, negated);
  }

  if (token.type === TokenType.NotExpression) {
    // Sequelize v6 silently drops an `Op.not` that directly wraps a `where()` instance: the
    // generated SQL contains the inner condition without the `NOT`. Wrapping the inner
    // expression in an `Op.and` group forces Sequelize to render `NOT (...)`, so the negation
    // applies to every negatable expression, including single comparisons and method calls.
    return {
      [Op.not]: {
        [Op.and]: [
          processLogicalExpression(token.value, tableName, rename, jsonbColumns, !negated),
        ],
      },
    };
  }

  const op =
    token.type === TokenType.AndExpression
      ? Op.and
      : token.type === TokenType.OrExpression
        ? Op.or
        : undefined;
  if (!op) {
    return processToken(token, tableName, rename, jsonbColumns, negated) as WhereOptions;
  }
  const flatten = (expr: any): WhereOptions => (op in expr ? expr[op] : expr);
  const left = flatten(
    processLogicalExpression(token.value.left, tableName, rename, jsonbColumns, negated),
  );
  const right = flatten(
    processLogicalExpression(token.value.right, tableName, rename, jsonbColumns, negated),
  );
  return { [op]: ([] as WhereOptions[]).concat(left).concat(right) };
}

/**
 * https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html
 *
 * @param query The OData query to convert to a Sequelize query.
 * @param tableName The name of the table to parse the query for.
 * @param rename A function for renaming incoming property names.
 * @param jsonbColumns Names of JSONB columns. Equality comparisons between a path into one of
 *   these columns and a scalar literal are translated to expressions a GIN index on the column
 *   can answer.
 * @returns The OData filter converted to a Sequelize query.
 */
export function odataFilterToSequelize(
  query: Token | string,
  tableName: string,
  rename: Rename = defaultRename,
  jsonbColumns: string[] = [],
): WhereOptions {
  if (!query) {
    return {};
  }
  const ast = typeof query === 'string' ? defaultParser.filter(query) : query;
  return processLogicalExpression(ast, tableName, rename, jsonbColumns, false);
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
