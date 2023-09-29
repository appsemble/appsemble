import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { createTestAction } from '../makeActions.js';
import { apiUrl, appId } from '../settings.js';

describe('user.register', () => {
  let mock: MockAdapter;
  let passwordLogin: Mock;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    passwordLogin = vi.fn();
  });

  it('should call the API to register a new user', async () => {
    mock.onPost(`${apiUrl}/api/user/apps/${appId}/account`).reply(() => [201]);
    const action = createTestAction({
      definition: {
        type: 'user.register',
        password: 'test',
        displayName: { prop: 'name' },
        email: 'test@example.com',
        properties: { static: { test: [1, 2, 3], property: 'Property', bool: true } },
      },
      passwordLogin,
      // eslint-disable-next-line unicorn/no-useless-undefined
      getUserInfo: () => undefined,
    });

    const result = await action({ name: 'name' });
    expect(result).toStrictEqual({ name: 'name' });
    expect(passwordLogin).toHaveBeenCalledWith({
      username: 'test@example.com',
      password: 'test',
    });
  });

  it('should do nothing and return data if user is logged in', async () => {
    mock.onPost(`${apiUrl}/api/user/apps/${appId}/account`).reply(() => [201]);
    const action = createTestAction({
      definition: {
        type: 'user.register',
        password: 'test',
        displayName: { prop: 'name' },
        email: 'test@example.com',
      },
      passwordLogin,
      getUserInfo: () => ({
        sub: 'some-user-id',
        email: 'test@example.com',
        email_verified: true,
        name: 'name',
      }),
    });

    const result = await action({ name: 'name' });
    expect(result).toStrictEqual({ name: 'name' });
    expect(passwordLogin).not.toHaveBeenCalled();
  });
});

describe('user.login', () => {
  let passwordLogin: Mock;

  beforeEach(() => {
    passwordLogin = vi.fn();
  });

  it('should log the user in', async () => {
    const action = createTestAction({
      definition: {
        type: 'user.login',
        password: 'test',
        email: 'test@example.com',
      },
      passwordLogin,
      // eslint-disable-next-line unicorn/no-useless-undefined
      getUserInfo: () => undefined,
    });

    const result = await action({ name: 'name' });
    expect(result).toStrictEqual({ name: 'name' });
    expect(passwordLogin).toHaveBeenCalledWith({ username: 'test@example.com', password: 'test' });
  });

  it('should do nothing and return the data if the user is logged in', async () => {
    const action = createTestAction({
      definition: {
        type: 'user.login',
        password: 'test',
        email: 'test@example.com',
      },
      passwordLogin,
      getUserInfo: () => ({
        sub: 'some-user-id',
        email: 'test@example.com',
        email_verified: true,
        name: 'name',
      }),
    });

    const result = await action({ name: 'name' });
    expect(result).toStrictEqual({ name: 'name' });
    expect(passwordLogin).not.toHaveBeenCalled();
  });
});

describe('user.update', () => {
  let mock: MockAdapter;
  let setUserInfo: Mock;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    setUserInfo = vi.fn();
  });

  it('should call the API for updating the user', async () => {
    mock.onPatch(`${apiUrl}/api/user/apps/${appId}/account`).reply(() => [
      201,
      {
        id: 'some-user-id',
        email: 'test2@example.com',
        emailVerified: false,
        name: 'name',
        picture: `${apiUrl}/api/apps/${appId}/members/some-user-id/picture`,
        properties: { test: '[1,2,3]', property: 'Property', bool: 'true' },
      },
    ]);
    const action = createTestAction({
      definition: {
        type: 'user.update',
        displayName: { prop: 'name' },
        email: 'test2@example.com',
        properties: { static: { test: [1, 2, 3], property: 'Property', bool: true } },
      },
      getUserInfo: () => ({
        sub: 'some-user-id',
        name: 'old name',
        email: 'test@example.com',
        email_verified: true,
        picture: 'https://example.com/old-avatar.jpg',
        properties: { test: '[1,2,3]', property: 'Property', bool: 'true' },
      }),
      setUserInfo,
    });

    const result = await action({ name: 'name', foo: 123 });
    expect(result).toStrictEqual({ name: 'name', foo: 123 });
    expect(setUserInfo).toHaveBeenCalledWith({
      sub: 'some-user-id',
      email: 'test2@example.com',
      email_verified: false,
      name: 'name',
      picture: `${apiUrl}/api/apps/${appId}/members/some-user-id/picture`,
      properties: { test: '[1,2,3]', property: 'Property', bool: 'true' },
    });
  });

  it('should do nothing and return the data if the user is not logged in', async () => {
    const action = createTestAction({
      definition: {
        type: 'user.update',
        displayName: { prop: 'name' },
        email: 'test@example.com',
      },
      // eslint-disable-next-line unicorn/no-useless-undefined
      getUserInfo: () => undefined,
    });

    const result = await action({ name: 'name' });
    expect(result).toStrictEqual({ name: 'name' });
    expect(setUserInfo).not.toHaveBeenCalled();
  });
});
