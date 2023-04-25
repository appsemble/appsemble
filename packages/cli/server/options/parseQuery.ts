import {
  FindOptions,
  OrderItem,
  ParsedQuery,
  ParseQueryParams,
  WhereOptions,
} from '@appsemble/node-utils/server/types.js';
import { defaultParser, Token, TokenType } from '@odata/parser';

function renameOData(name: string): string {
  switch (name) {
    case '$author':
      return 'AuthorId';
    case 'id':
      return name;
    default:
      return name;
  }
}

// function processToken(token: Token): WhereOptions | WhereValue {
//   if (token.type === 'FirstMemberExpression') {
//     return processName(token, model, rename) as WhereValue;
//   }
//   if (token.type === TokenType.MethodCallExpression) {
//     return processMethod(token, model, rename);
//   }
//   if (token.type === TokenType.ParenExpression) {
//     return processToken(token.value, model, rename);
//   }
//   if (operators.has(token.type)) {
//     return where(
//       processToken(token.value.left, model, rename),
//       operators.get(token.type),
//       processToken(token.value.right, model, rename),
//     );
//   }
//
//   if (token.type === TokenType.Literal) {
//     return processLiteral(token);
//   }
//   throw new TypeError(`${token.position}: Unhandled OData type: ${token.type}`);
// }

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

  // if (!op) {
  //   return processToken(token) as WhereOptions;
  // }

  const flatten = (expr: any): WhereOptions => (op in expr ? expr[op] : expr);
  const left = flatten(processLogicalExpression(token.value.left));
  const right = flatten(processLogicalExpression(token.value.right));
  return { [op]: [].concat(left).concat(right) };
}

const parseOdataFilter = (query: Token | string): WhereOptions => {
  if (!query) {
    return {};
  }
  const ast = typeof query === 'string' ? defaultParser.filter(query) : query;
  return processLogicalExpression(ast);
};

const parseOdataOrder = (query: string): OrderItem[] => {
  if (!query) {
    return [];
  }

  return query.split(/,/g).map((line: string) => {
    const [name, direction] = line.split(' ');
    return {
      property: renameOData(name),
      direction: direction?.toUpperCase() === 'DESC' ? -1 : 1,
    };
  });
};

export const parseQuery = ({ $filter, $orderby }: ParseQueryParams): ParsedQuery => {
  console.log('FILTER', $filter, parseOdataFilter($filter));
  console.log(
    'ORDERBY',
    $orderby,
    parseOdataOrder($orderby.replace(/(^|\B)\$author\/id(\b|$)/g, '$author')),
  );

  return {
    where: { where: parseOdataFilter($filter) },
    order: parseOdataOrder($orderby.replace(/(^|\B)\$author\/id(\b|$)/g, '$author')),
  };
};
