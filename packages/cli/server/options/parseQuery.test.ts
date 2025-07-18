import { type ResourceDefinition } from '@appsemble/lang-sdk';
import { describe, expect, it } from 'vitest';

import { parseQuery } from './parseQuery.js';

describe('parseQuery', () => {
  it('should parse the query correctly with valid parameters', () => {
    const queryParams = {
      tableName: 'Resource',
      $filter: "AuthorId eq 1 and (Title ne 'example' or Year gt 2020)",
      $orderby: 'Title asc,Year desc',
      resourceDefinition: {} as ResourceDefinition,
    };

    const expectedParsedQuery = {
      where: {
        and: [
          { AuthorId: { eq: 1 } },
          {
            or: [{ Title: { ne: 'example' } }, { Year: { gt: 2020 } }],
          },
        ],
      },
      order: [
        ['Title', 'ASC'],
        ['Year', 'DESC'],
      ],
    };

    const parsedQuery = parseQuery(queryParams);

    expect(parsedQuery).toStrictEqual(expectedParsedQuery);
  });

  it('should parse the query with special characters in $orderby', () => {
    const queryParams = {
      tableName: 'Resource',
      $filter: "Title eq 'example'",
      $orderby: 'Title asc,$author/id desc',
      resourceDefinition: {} as ResourceDefinition,
    };

    const expectedParsedQuery = {
      where: {
        Title: { eq: 'example' },
      },
      order: [
        ['Title', 'ASC'],
        ['AuthorId', 'DESC'],
      ],
    };

    const parsedQuery = parseQuery(queryParams);

    expect(parsedQuery).toStrictEqual(expectedParsedQuery);
  });
});
