import { ConnectionError } from 'sequelize';
import { describe, expect, it } from 'vitest';

import { handleDBError } from './sqlUtils.js';

describe('handleDBError', () => {
  it('should keep the text of the underlying connection error', () => {
    const error = new ConnectionError(new Error('password authentication failed for user "admin"'));

    expect(() => handleDBError(error)).toThrow('password authentication failed for user "admin"');
  });
});
