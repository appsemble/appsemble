import { beforeEach, expect, it, vi } from 'vitest';
import { type Argv } from 'yargs';

import { AppsembleError } from './AppsembleError.js';
import { handleError } from './handleError.js';
import { logger } from './logger.js';

let yargs: Argv;

beforeEach(() => {
  yargs = { showHelp: vi.fn<any>() } as Partial<Argv> as Argv;
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  vi.spyOn(console, 'error').mockImplementation(null);
  vi.spyOn(process, 'exit').mockImplementation(() => null as never);
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  vi.spyOn(logger, 'error').mockImplementation(null);
});

it('should show the help message if it is passed a yargs message', () => {
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  handleError('Command foo not found', undefined, yargs);
  // eslint-disable-next-line no-console
  expect(console.error).toHaveBeenCalledWith('Command foo not found');
  expect(yargs.showHelp).toHaveBeenCalledWith();
  expect(logger.error).not.toHaveBeenCalled();
  expect(process.exit).toHaveBeenCalledWith(1);
});

it('should log the message of an Appsemble error', () => {
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  handleError(undefined, new AppsembleError('Oh noez!'), yargs);
  expect(yargs.showHelp).not.toHaveBeenCalled();
  expect(logger.error).toHaveBeenCalledWith('Oh noez!');
  expect(process.exit).toHaveBeenCalledWith(1);
});

it('should log unknown errors raw', () => {
  const error = new Error('Oh noez!');
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  handleError(undefined, error, yargs);
  expect(yargs.showHelp).not.toHaveBeenCalled();
  expect(logger.error).toHaveBeenCalledWith(error);
  expect(process.exit).toHaveBeenCalledWith(1);
});
