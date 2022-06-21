import { scopes } from '../../../constants';
import { cli } from './cli';

it('should match the known scopes defined in utils', () => {
  expect(Object.keys(cli.flows.clientCredentials.scopes)).toStrictEqual(scopes);
});
