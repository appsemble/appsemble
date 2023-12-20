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
  const currentEmail = 'test@gmail.com';
  const newEmail = 'test.updated@gmail.com';
  const managerEmail = 'manager@gmail.com';

  beforeEach(() => {
    mock = new MockAdapter(axios);
    setUserInfo = vi.fn();
  });

  it('should call the API for updating the user', async () => {
    mock.onPatch(`${apiUrl}/api/user/apps/${appId}/accounts/${currentEmail}`).reply(() => [
      201,
      {
        id: 'some-user-id',
        email: currentEmail,
        emailVerified: false,
        name: 'name',
        picture: `${apiUrl}/api/apps/${appId}/members/some-user-id/picture`,
        properties: { test: '[1,2,3]', property: 'Property', bool: 'true' },
      },
    ]);
    const action = createTestAction({
      definition: {
        type: 'user.update',
        name: { prop: 'name' },
        currentEmail,
        newEmail: currentEmail,
        properties: { static: { test: [1, 2, 3], property: 'Property', bool: true } },
      },
      getUserInfo: () => ({
        sub: 'some-user-id',
        name: 'old name',
        email: currentEmail,
        email_verified: true,
        picture: 'https://example.com/old-avatar.jpg',
        properties: { test: [1, 2, 3], property: 'Property', bool: true },
      }),
      setUserInfo,
    });

    const result = await action({ name: 'name' });
    expect(result).toStrictEqual({
      id: 'some-user-id',
      name: 'name',
      email: currentEmail,
      emailVerified: false,
      picture: 'https://appsemble.dev/api/apps/42/members/some-user-id/picture',
      properties: {
        bool: 'true',
        property: 'Property',
        test: '[1,2,3]',
      },
    });
    expect(setUserInfo).toHaveBeenCalledWith({
      sub: 'some-user-id',
      email: currentEmail,
      email_verified: false,
      name: 'name',
      picture: `${apiUrl}/api/apps/${appId}/members/some-user-id/picture`,
      properties: { test: [1, 2, 3], property: 'Property', bool: true },
    });
  });

  it('should do nothing and return the data if the user is not logged in', async () => {
    const action = createTestAction({
      definition: {
        type: 'user.update',
        name: { prop: 'name' },
        currentEmail,
        newEmail: currentEmail,
      },
      // eslint-disable-next-line unicorn/no-useless-undefined
      getUserInfo: () => undefined,
    });

    const result = await action({ name: 'name' });
    expect(result).toStrictEqual({ name: 'name' });
    expect(setUserInfo).not.toHaveBeenCalled();
  });

  it('should update another user if called by account manager', async () => {
    mock.onPatch(`${apiUrl}/api/user/apps/${appId}/accounts/${currentEmail}`).reply(() => [
      201,
      {
        id: 'some-user-id',
        email: newEmail,
        emailVerified: false,
        name: 'name',
        picture: `${apiUrl}/api/apps/${appId}/members/some-user-id/picture`,
        properties: { test: '[1,2,3]', property: 'Property', bool: 'true' },
      },
    ]);
    const action = createTestAction({
      definition: {
        type: 'user.update',
        name: { prop: 'name' },
        currentEmail,
        newEmail,
        properties: { static: { test: [1, 2, 3], property: 'Property', bool: true } },
      },
      getUserInfo: () => ({
        sub: 'some-user-id',
        name: 'old name',
        email: managerEmail,
        email_verified: true,
        picture: 'https://example.com/old-avatar.jpg',
        properties: {},
      }),
      setUserInfo,
    });

    const result = await action({ name: 'name' });
    expect(result).toStrictEqual({
      id: 'some-user-id',
      name: 'name',
      email: newEmail,
      emailVerified: false,
      picture: 'https://appsemble.dev/api/apps/42/members/some-user-id/picture',
      properties: {
        bool: 'true',
        property: 'Property',
        test: '[1,2,3]',
      },
    });
    expect(setUserInfo).not.toHaveBeenCalled();
  });
});

describe('user.query', () => {
  let mock: MockAdapter;
  let setUserInfo: Mock;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    setUserInfo = vi.fn();
  });

  it('should call the API for getting all users by roles', async () => {
    mock.onGet(`${apiUrl}/api/user/apps/${appId}/accounts?roles=Role1,Role2,Role3`).reply(() => [
      200,
      [
        {
          id: 'role-1-id',
          email: 'role1@gmail.com',
          emailVerified: false,
          name: 'name',
          picture: `${apiUrl}/api/apps/${appId}/members/some-user-id/picture`,
          properties: {},
        },
        {
          id: 'role-2-id',
          email: 'role2@gmail.com',
          emailVerified: false,
          name: 'name',
          picture: `${apiUrl}/api/apps/${appId}/members/some-user-id/picture`,
          properties: {},
        },
        {
          id: 'role-3-id',
          email: 'role3@gmail.com',
          emailVerified: false,
          name: 'name',
          picture: `${apiUrl}/api/apps/${appId}/members/some-user-id/picture`,
          properties: {},
        },
      ],
    ]);

    const action = createTestAction({
      definition: {
        type: 'user.query',
        roles: {
          'array.from': ['Role1', 'Role2', 'Role3'],
        },
      },
      getUserInfo: () => ({
        sub: 'manager-id',
        name: 'name',
        email: 'manager@gmail.com',
        email_verified: true,
        picture: 'https://example.com/avatar.jpg',
        properties: {},
      }),
      setUserInfo,
    });

    const result = await action({
      roles: {
        'array.from': ['Role1', 'Role2', 'Role3'],
      },
    });
    expect(result).toStrictEqual([
      {
        id: 'role-1-id',
        email: 'role1@gmail.com',
        emailVerified: false,
        name: 'name',
        picture: `${apiUrl}/api/apps/${appId}/members/some-user-id/picture`,
        properties: {},
      },
      {
        id: 'role-2-id',
        email: 'role2@gmail.com',
        emailVerified: false,
        name: 'name',
        picture: `${apiUrl}/api/apps/${appId}/members/some-user-id/picture`,
        properties: {},
      },
      {
        id: 'role-3-id',
        email: 'role3@gmail.com',
        emailVerified: false,
        name: 'name',
        picture: `${apiUrl}/api/apps/${appId}/members/some-user-id/picture`,
        properties: {},
      },
    ]);
  });

  it('should do nothing and return the data if the user is not logged in', async () => {
    const action = createTestAction({
      definition: {
        type: 'user.query',
        roles: {
          'array.from': ['Role1', 'Role2', 'Role3'],
        },
      },
      // eslint-disable-next-line unicorn/no-useless-undefined
      getUserInfo: () => undefined,
    });

    const result = await action({
      roles: {
        'array.from': ['Role1', 'Role2', 'Role3'],
      },
    });
    expect(result).toStrictEqual({
      roles: {
        'array.from': ['Role1', 'Role2', 'Role3'],
      },
    });
  });
});

describe('user.remove', () => {
  let mock: MockAdapter;
  let setUserInfo: Mock;
  const managerEmail = 'manager@gmail.com';
  const memberEmail = 'test@gmail.com';

  beforeEach(() => {
    mock = new MockAdapter(axios);
    setUserInfo = vi.fn();
  });

  it('should call the API for removing a user', async () => {
    mock
      .onDelete(`${apiUrl}/api/user/apps/${appId}/accounts/${memberEmail}`)
      .reply(() => [204, []]);

    const action = createTestAction({
      definition: {
        type: 'user.remove',
        email: memberEmail,
      },
      getUserInfo: () => ({
        sub: 'manager-id',
        name: 'name',
        email: managerEmail,
        email_verified: true,
        picture: 'https://example.com/avatar.jpg',
        properties: {},
      }),
      setUserInfo,
    });

    const result = await action({
      email: memberEmail,
    });
    expect(result).toStrictEqual([]);
  });

  it('should do nothing and return the data if the user is not logged in', async () => {
    const action = createTestAction({
      definition: {
        type: 'user.remove',
        email: managerEmail,
      },
      // eslint-disable-next-line unicorn/no-useless-undefined
      getUserInfo: () => undefined,
    });

    const result = await action({
      email: memberEmail,
    });
    expect(result).toStrictEqual({
      email: memberEmail,
    });
  });
});
