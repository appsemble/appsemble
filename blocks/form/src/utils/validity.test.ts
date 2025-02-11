import { describe, expect, it } from 'vitest';

import { isFormValid } from './validity.js';

describe('validity', () => {
  it('should return false if there are any errors', () => {
    const value = isFormValid({
      testField: 'Test Error',
    });
    expect(value).toBe(false);
  });
});
