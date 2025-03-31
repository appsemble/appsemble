import { expect, it } from 'vitest';

import { cli } from './cli.js';
import { scopes } from '../../../constants/index.js';

it('should match the known scopes defined in utils', () => {
  expect(Object.keys(cli.flows.clientCredentials?.scopes ?? {})).toStrictEqual(scopes);
});
