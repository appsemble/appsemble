import { AppsembleError } from './AppsembleError';

it('should define AppsembleError as its name', () => {
  const error = new AppsembleError('message');
  expect(error.name).toBe('AppsembleError');
});
