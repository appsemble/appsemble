import {
  type OrderItem,
  type ParsedQuery,
  type ParseQueryParams,
  processLiteral,
  type WhereOptions,
} from '@appsemble/node-utils';
import { defaultParser, type Token, TokenType } from '@odata/parser';

const operators = new Map([
  [TokenType.EqualsExpression, 'eq'],
  [TokenType.LesserOrEqualsExpression, 'lte'],
  [TokenType.LesserThanExpression, 'lt'],
  [TokenType.GreaterOrEqualsExpression, 'gte'],
  [TokenType.GreaterThanExpression, 'gt'],
  [TokenType.NotEqualsExpression, 'ne'],
]);

function renameOData(name: string): string {
  switch (name) {
    case '$author/id':
      return 'AuthorId';
    default:
      return name;
  }
}

function processToken(token: Token): any {
  if (token.type === TokenType.ParenExpression) {
    return processToken(token.value);
  }

  if (token.type === TokenType.FirstMemberExpression) {
    return token.raw;
  }

  if (operators.has(token.type)) {
    return {
      [processToken(token.value.left)]: {
        [operators.get(token.type)!]: processToken(token.value.right),
      },
    };
  }

  if (token.type === TokenType.Literal) {
    return processLiteral(token);
  }

  throw new TypeError(`${token.position}: Unhandled OData type: ${token.type}`);
}

function processLogicalExpression(token: Token): WhereOptions {
  if (token.type === TokenType.BoolParenExpression || token.type === TokenType.CommonExpression) {
    return processLogicalExpression(token.value);
  }

  if (token.type === TokenType.NotExpression) {
    return { not: processLogicalExpression(token.value) };
  }

  const op =
    token.type === TokenType.AndExpression
      ? 'and'
      : token.type === TokenType.OrExpression
        ? 'or'
        : undefined;

  if (!op) {
    return processToken(token) as WhereOptions;
  }

  const flatten = (expr: any): WhereOptions => (op in expr ? expr[op] : expr);

  const left = flatten(processLogicalExpression(token.value.left));
  const right = flatten(processLogicalExpression(token.value.right));

  return { [op]: ([] as WhereOptions[]).concat(left).concat(right) };
}

function parseOdataFilter(query: Token | string): WhereOptions {
  if (!query) {
    return {};
  }

  if (typeof query === 'string') {
    const renamedQuery = query
      .split(' ')
      .map((queryItem) => renameOData(queryItem))
      .join(' ');
    const ast = defaultParser.filter(renamedQuery);
    return processLogicalExpression(ast);
  }

  return processLogicalExpression(query);
}

function parseOdataOrder(query: string): OrderItem[] {
  if (!query) {
    return [];
  }

  return query.split(/,/g).map((line: string) => {
    const [name, direction] = line.split(' ');
    return [renameOData(name), direction?.toUpperCase()];
  });
}

export function parseQuery({ $filter, $orderby }: ParseQueryParams): ParsedQuery {
  const where = parseOdataFilter($filter);

  const order = parseOdataOrder($orderby);

  return { where, order };
}
