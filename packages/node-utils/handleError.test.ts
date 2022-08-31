import { Argv } from 'yargs';

import { AppsembleError } from './AppsembleError.js';
import { handleError } from './handleError.js';
import { logger } from './logger.js';

let yargs: Argv;

beforeEach(() => {
  yargs = { showHelp: import.meta.jest.fn() } as Partial<Argv> as Argv;
  import.meta.jest.spyOn(console, 'error').mockImplementation();
  import.meta.jest.spyOn(process, 'exit').mockImplementation();
  import.meta.jest.spyOn(logger, 'error').mockImplementation();
});

it('should show the help message if it is passed a yargs message', () => {
  handleError('Command foo not found', undefined, yargs);
  // eslint-disable-next-line no-console
  expect(console.error).toHaveBeenCalledWith('Command foo not found');
  expect(yargs.showHelp).toHaveBeenCalledWith();
  expect(logger.error).not.toHaveBeenCalled();
  expect(process.exit).toHaveBeenCalledWith(1);
});

it('should log the message of an Appsemble error', () => {
  handleError(undefined, new AppsembleError('Oh noez!'), yargs);
  expect(yargs.showHelp).not.toHaveBeenCalled();
  expect(logger.error).toHaveBeenCalledWith('Oh noez!');
  expect(process.exit).toHaveBeenCalledWith(1);
});

it('should log unknown errors raw', () => {
  const error = new Error('Oh noez!');
  handleError(undefined, error, yargs);
  expect(yargs.showHelp).not.toHaveBeenCalled();
  expect(logger.error).toHaveBeenCalledWith(error);
  expect(process.exit).toHaveBeenCalledWith(1);
});
