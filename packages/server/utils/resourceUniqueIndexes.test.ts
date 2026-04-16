import { describe, expect, it } from 'vitest';

import { getResourceUniqueConstraintViolationError } from './resourceUniqueIndexes.js';

describe('resourceUniqueIndexes', () => {
  it('should not infer a resource unique conflict for unrelated unique errors', () => {
    const error = Object.assign(new Error('duplicate key value violates unique constraint'), {
      name: 'SequelizeUniqueConstraintError',
      original: {
        code: '23505',
        constraint: 'SomeOtherUniqueIndex',
      },
    });

    const violation = getResourceUniqueConstraintViolationError(
      'person',
      {
        schema: {
          type: 'object',
          properties: {
            email: { type: 'string' },
          },
        },
        unique: ['email'],
      },
      error as any,
    );

    expect(violation).toBeUndefined();
  });
});
