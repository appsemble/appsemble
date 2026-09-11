import { describe, expect, it } from 'vitest';

import { getResourcePositionIndexName } from './resourcePositionIndexes.js';
import {
  getResourceUniqueConstraintViolationError,
  throwResourcePositionConflictKoaError,
} from './resourceUniqueIndexes.js';

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

  it('should report a position index violation as a conflict', () => {
    const thrown = new Error('ctx.throw');
    const ctx = {
      response: {},
      throw() {
        throw thrown;
      },
    } as any;
    const error = Object.assign(new Error('duplicate key value violates unique constraint'), {
      name: 'SequelizeUniqueConstraintError',
      original: {
        code: '23505',
        constraint: getResourcePositionIndexName('task', ['courseTypeId'], 'ungrouped'),
      },
    });

    expect(() => throwResourcePositionConflictKoaError(ctx, 'task', error)).toThrow(thrown);
    expect(ctx.response).toMatchObject({
      body: {
        error: 'Conflict',
        message:
          'Another resource of type “task” already occupies this position in the same ordering group',
        statusCode: 409,
      },
    });
  });

  it('should leave an error that is not a position index violation alone', () => {
    const ctx = {
      response: {},
      throw() {
        throw new Error('ctx.throw');
      },
    } as any;
    const error = Object.assign(new Error('duplicate key value violates unique constraint'), {
      name: 'SequelizeUniqueConstraintError',
      original: { code: '23505', constraint: 'App_path_OrganizationId_key' },
    });

    expect(() => throwResourcePositionConflictKoaError(ctx, 'task', error)).not.toThrow();
  });
});
