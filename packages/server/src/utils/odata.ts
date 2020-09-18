import { defaultParser, Token, TokenType } from '@odata/parser';
import { Op, Order, WhereOptions } from 'sequelize';

/**
 * A function which accepts the name in the filter, and returns a name to replace it with.
 *
 * @param name - The original name. This uses `/` as a separator.
 *
 * @returns The new name to use instead.
 */
type Rename = (name: string) => string;

const defaultRename: Rename = (name) => name;

const operators = new Map([
  [TokenType.EqualsExpression, Op.eq],
  [TokenType.LesserOrEqualsExpression, Op.lte],
  [TokenType.LesserThanExpression, Op.lt],
  [TokenType.GreaterOrEqualsExpression, Op.gte],
  [TokenType.GreaterThanExpression, Op.gt],
  [TokenType.NotEqualsExpression, Op.ne],
]);

const comparisonMethods = new Map(
  Object.entries({
    startswith: Op.startsWith,
    endswith: Op.endsWith,
    substringof: Op.substring,
  }),
);

function processLiteral(token: Token, nested: boolean): unknown {
  switch (token.value) {
    case 'Edm.Boolean':
      return token.raw === 'true';
    case 'Edm.Date':
      // JSON properties don’t support native date objects. Treat them as strings instead.
      if (nested) {
        return token.raw;
      }
      return new Date(token.raw);
    case 'Edm.SByte':
      return Number(token.raw);
    case 'Edm.String':
      return token.raw.slice(1, -1);
    default:
      process.emitWarning(`Unhandled OData literal type: ${token.value}`);
  }
}

function processName(token: Token, rename: Rename): [name: string, nested: boolean] {
  const name = rename(token.raw).replace(/\//g, '.');
  // OData uses `/` as a path separator, but Sequelize uses `.`.
  // https://sequelize.org/master/manual/other-data-types.html#jsonb--postgresql-only-
  return [name, name.includes('.')];
}

function processMethod(token: Token, rename: Rename): WhereOptions {
  const comparison = comparisonMethods.get(token.value.method);
  if (comparison) {
    const [name, nested] = processName(token.value.parameters[0], rename);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return { [name]: { [comparison]: processToken(token.value.parameters[1], rename, nested) } };
  }
}

function processToken(token: Token, rename: Rename, nested = false): unknown {
  const operator = operators.get(token.type);
  if (operator) {
    const [name, isNested] = processName(token.value.left, rename);
    return { [name]: { [operator]: processToken(token.value.right, rename, isNested) } };
  }

  switch (token.type) {
    case TokenType.CommonExpression:
      return processToken(token.value, rename, nested);
    case TokenType.Literal:
      return processLiteral(token, nested);
    case TokenType.AndExpression:
      return {
        [Op.and]: [processToken(token.value.left, rename), processToken(token.value.right, rename)],
      };
    case TokenType.OrExpression:
      return {
        [Op.or]: [processToken(token.value.left, rename), processToken(token.value.right, rename)],
      };
    case TokenType.MethodCallExpression:
      return processMethod(token, rename);
    default:
      process.emitWarning(`Unhandled OData type: ${token.type}`);
  }
}

export function odataFilterToSequelize(
  query: string | Token,
  rename: Rename = defaultRename,
): WhereOptions {
  if (!query) {
    return {};
  }
  // eslint-disable-next-line unicorn/no-fn-reference-in-iterator
  const ast = typeof query === 'string' ? defaultParser.filter(query) : query;
  return processToken(ast, rename) as WhereOptions;
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
