import semver from 'semver';
import { expect, it } from 'vitest';

import { migrations } from './index.js';

it('should be sorted by semver key', () => {
  const keys = migrations.map(({ key }) => key);
  expect(keys).toStrictEqual([...keys].sort(semver.compare));
});
