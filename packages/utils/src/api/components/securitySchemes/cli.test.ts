import { scopes } from '../../../constants';
import securityScheme from './cli';

it('should match the known scopes defined in utils', () => {
  expect(Object.keys(securityScheme.flows.clientCredentials.scopes)).toStrictEqual(scopes);
});
