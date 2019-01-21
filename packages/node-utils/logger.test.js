import { configureLogger, logger, setLogLevel } from '.';

describe('setLogLevel', () => {
  afterEach(() => {
    setLogLevel();
  });

  it('should set the level of the exported logger based on a string', () => {
    setLogLevel('verbose');
    expect(logger.level).toBe('verbose');
  });

  it('should set the level of the exported logger based on a number', () => {
    setLogLevel(1);
    expect(logger.level).toBe('error');
  });

  it('should set the level of the exported logger based on a numeric string', () => {
    setLogLevel('2');
    expect(logger.level).toBe('warn');
  });
});

describe('configureLogger', () => {
  afterEach(() => {
    setLogLevel();
  });

  it('should configure a log level based on the quiet count of the argv', () => {
    configureLogger({ quiet: 1 });
    expect(logger.level).toBe('warn');
  });

  it('should configure a log level based on the verbose count of the argv', () => {
    configureLogger({ verbose: 1 });
    expect(logger.level).toBe('verbose');
  });

  it('should configure a log level based on the combined quiet and verbose count', () => {
    configureLogger({ quiet: 1, verbose: 1 });
    expect(logger.level).toBe('info');
  });
});
