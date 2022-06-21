import { basicAuth } from './basicAuth';

it('should serialize credentials', () => {
  const result = basicAuth('me', 'password1');
  expect(result).toBe('Basic bWU6cGFzc3dvcmQx');
});
