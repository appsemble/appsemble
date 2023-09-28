import { expect, it } from 'vitest';

import { AppsembleError } from './AppsembleError.js';

it('should define AppsembleError as its name', () => {
  const error = new AppsembleError('message');
  expect(error.name).toBe('AppsembleError');
});
