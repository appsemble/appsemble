import { install, InstalledClock } from '@sinonjs/fake-timers';
import axios, { AxiosInstance } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { highlight } from 'cli-highlight';
import FormData from 'form-data';

import { configureAxios, formData, logger, requestLogger, responseLogger } from './index.js';

function h(content: string): string {
  return highlight(content, { language: 'http' });
}

let instance: AxiosInstance;
let mock: MockAdapter;
let clock: InstalledClock;

jest.mock('os');

beforeEach(() => {
  clock = install();
});

afterEach(() => {
  clock.uninstall();
});

describe('formData', () => {
  beforeAll(() => {
    instance = axios.create();
    instance.interceptors.request.use(formData);
    mock = new MockAdapter(instance);
  });

  it('should add headers for form-data requests', async () => {
    let headers;
    mock.onAny('/').reply((config) => {
      ({ headers } = config);
      return [200];
    });
    const form = new FormData();
    await instance.post('/', form);
    expect(headers).toHaveProperty(
      'Content-Type',
      expect.stringMatching(/^multipart\/form-data; boundary=/),
    );
  });

  it('should not add headers to non form-data requests', async () => {
    let headers;
    mock.onAny('/').reply((config) => {
      ({ headers } = config);
      return [200];
    });
    await instance.post('/', {});
    expect(headers).toBeUndefined();
  });
});

describe('requestLogger', () => {
  beforeAll(() => {
    instance = axios.create();
    instance.interceptors.request.use(requestLogger);
    mock = new MockAdapter(instance);
    mock.onAny().reply(200);
  });

  it('should log requests', async () => {
    jest.spyOn(logger, 'verbose');
    await instance.get('/');
    expect(logger.verbose).toHaveBeenCalledWith(`> 0 ${h('GET / HTTP/1.1')}`);
  });
});

describe('responseLogger', () => {
  beforeAll(() => {
    instance = axios.create();
    instance.interceptors.response.use(responseLogger);
    mock = new MockAdapter(instance);
    mock.onAny().reply(200);
  });

  it('should log responses', async () => {
    jest.spyOn(logger, 'verbose');
    await instance.get('/');
    expect(logger.verbose).toHaveBeenCalledWith(expect.any(String));
  });
});

describe('configureAxios', () => {
  beforeEach(() => {
    jest.spyOn(axios.interceptors.request, 'use').mockImplementation();
    jest.spyOn(axios.interceptors.response, 'use').mockImplementation();
  });

  it('should set the correct user agent', () => {
    configureAxios('TestClient', '1.2.3');
    expect(axios.defaults.headers.common['user-agent']).toBe(
      `TestClient/1.2.3 (Linux x64; Node ${process.version})`,
    );
  });

  it('should apply all interceptors', () => {
    configureAxios('TestClient', '1.2.3');
    expect(axios.interceptors.request.use).toHaveBeenCalledWith(formData);
    expect(axios.interceptors.request.use).toHaveBeenCalledWith(requestLogger);
    expect(axios.interceptors.response.use).toHaveBeenCalledWith(responseLogger);
  });
});
