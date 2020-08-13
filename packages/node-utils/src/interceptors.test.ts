import os from 'os';
import { Readable } from 'stream';
import { URLSearchParams } from 'url';

import { logger } from '@appsemble/node-utils';
import axios, { AxiosInstance } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import FormData from 'form-data';

import { configureAxios, formData, requestLogger, responseLogger } from './interceptors';

let instance: AxiosInstance;
let mock: MockAdapter;

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
    jest.spyOn(logger, 'info');
    jest.spyOn(logger, 'silly');
    await instance.get('/');
    expect(logger.info).toHaveBeenCalledWith('Start GET /');
    expect(logger.silly).not.toHaveBeenCalled();
  });

  it('should log request bodies', async () => {
    jest.spyOn(logger, 'info');
    jest.spyOn(logger, 'silly');
    await instance.post('/', {});
    expect(logger.info).toHaveBeenCalledWith('Start POST /');
    expect(logger.silly).toHaveBeenCalledWith('Request body: {}');
  });

  it('should url search params', async () => {
    jest.spyOn(logger, 'info');
    jest.spyOn(logger, 'silly');
    await instance.post('/', new URLSearchParams({ foo: 'bar' }));
    expect(logger.info).toHaveBeenCalledWith('Start POST /');
    expect(logger.silly).toHaveBeenCalledWith('Request body: foo=bar');
  });

  it('should log streams', async () => {
    jest.spyOn(logger, 'info');
    jest.spyOn(logger, 'silly');
    const stream = new Readable();
    await instance.post('/', stream);
    expect(logger.info).toHaveBeenCalledWith('Start POST /');
    expect(logger.silly).toHaveBeenCalledWith('Request body: Stream');
  });
});

describe('responseLogger', () => {
  beforeAll(() => {
    instance = axios.create();
    instance.interceptors.response.use(responseLogger);
    mock = new MockAdapter(instance);
  });

  it('should log responses', async () => {
    jest.spyOn(logger, 'info');
    jest.spyOn(logger, 'silly');
    mock.onGet('/').reply(200, {});
    await instance.get('/');
    expect(logger.info).toHaveBeenCalledWith('Success GET /');
    expect(logger.silly).toHaveBeenCalledWith('Response body: {}');
  });
});

describe('configureAxios', () => {
  beforeEach(() => {
    jest.spyOn(axios.interceptors.request, 'use').mockImplementation();
    jest.spyOn(axios.interceptors.response, 'use').mockImplementation();
    jest.spyOn(os, 'type').mockReturnValue('Linux');
    jest.spyOn(os, 'arch').mockReturnValue('x64');
  });

  it('should set the correct user agent', () => {
    configureAxios('TestClient', '1.2.3');
    expect(axios.defaults.headers.common['user-agent']).toBe(
      `TestClient/1.2.3 (Linux x64; Node ${process.version})`,
    );
  });

  it('should apply all interceptors', () => {
    expect(axios.interceptors.request.use).toHaveBeenCalledWith(formData);
    expect(axios.interceptors.request.use).toHaveBeenCalledWith(requestLogger);
    expect(axios.interceptors.response.use).toHaveBeenCalledWith(responseLogger);
  });
});
