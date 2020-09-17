import { defaultParser, Token, TokenType } from '@odata/parser';
import { Op, WhereOptions } from 'sequelize';

/**
 * A function which accepts the name in the filter, and returns a name to replace it with.
 */
type Rename = (name: string) => string;

const defaultRename: Rename = (name) => name;

function parseLiteral(token: Token, nested: boolean): unknown {
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

function processToken(token: Token, rename: Rename, nested = false): unknown {
  switch (token.type) {
    case TokenType.EqualsExpression: {
      const name = rename(token.value.left.raw);
      // OData uses / as a path separator, but Sequelize uses dots.
      // https://sequelize.org/master/manual/other-data-types.html#jsonb--postgresql-only-
      if (name.includes('/')) {
        return {
          [name.replace(/\//g, '.')]: { [Op.eq]: processToken(token.value.right, rename, true) },
        };
      }
      return {
        [name]: { [Op.eq]: processToken(token.value.right, rename) },
      };
    }
    case TokenType.Literal:
      return parseLiteral(token, nested);
    case TokenType.AndExpression:
      return {
        [Op.and]: [processToken(token.value.left, rename), processToken(token.value.right, rename)],
      };
    case TokenType.OrExpression:
      return {
        [Op.or]: [processToken(token.value.left, rename), processToken(token.value.right, rename)],
      };
    default:
  }
}

export function odataFilterToSequelize(query: string, rename = defaultRename): WhereOptions {
  // eslint-disable-next-line unicorn/no-fn-reference-in-iterator
  const ast = defaultParser.filter(query);
  return processToken(ast, rename) as WhereOptions;
}
