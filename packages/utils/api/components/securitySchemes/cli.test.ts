import { scopes } from '../../../constants/index.js';
import { cli } from './cli.js';

it('should match the known scopes defined in utils', () => {
  expect(Object.keys(cli.flows.clientCredentials.scopes)).toStrictEqual(scopes);
});
