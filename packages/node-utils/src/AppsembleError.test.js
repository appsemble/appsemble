import AppsembleError from './AppsembleError';

it('should define AppsembleError as its name', () => {
  class InheritedError extends AppsembleError {}
  const error = new InheritedError();
  expect(error.name).toBe('AppsembleError');
});
