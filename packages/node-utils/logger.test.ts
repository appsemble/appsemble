import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { afterEach, describe, expect, it } from 'vitest';

import { configureLogger, logger, setLogLevel } from './logger.js';

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

describe('logger', () => {
  it('should not log the request secrets of a failed request', async () => {
    const mock = new MockAdapter(axios as ConstructorParameters<typeof MockAdapter>[0]);
    mock.onGet().networkError();
    const error = await axios
      .get('https://example.com', {
        params: { key: 'query-secret' },
        headers: { Cookie: 'id=cookie-secret', 'X-Key': 'header-secret' },
      })
      .catch((err: unknown) => err);
    mock.restore();
    let logs = '';
    const capture = (info: Record<symbol, string>): void => {
      logs += info[Symbol.for('message')];
    };
    logger.on('data', capture);

    logger.error(error);

    logger.off('data', capture);
    const secrets = ['query-secret', 'cookie-secret', 'header-secret'];
    expect(secrets.filter((secret) => logs.includes(secret))).toStrictEqual([]);
  });
});
