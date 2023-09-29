import { expect, it } from 'vitest';

import { basicAuth } from './basicAuth.js';

it('should serialize credentials', () => {
  const result = basicAuth('me', 'password1');
  expect(result).toBe('Basic bWU6cGFzc3dvcmQx');
});
