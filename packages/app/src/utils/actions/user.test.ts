import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { createTestAction } from '../makeActions';
import { apiUrl, appId } from '../settings';

describe('user.register', () => {
  let mock: MockAdapter;
  let passwordLogin: jest.Mock;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    passwordLogin = jest.fn();
  });

  it('should call the API to register a new user', async () => {
    mock.onPost(`${apiUrl}/api/user/apps/${appId}/account`).reply(() => [201]);
    const userInfo: any = undefined;
    const action = createTestAction({
      definition: {
        type: 'user.register',
        password: 'test',
        displayName: { prop: 'name' },
        email: 'test@example.com',
      },
      passwordLogin,
      getUserInfo: () => userInfo,
    });

    const result = await action({ name: 'name' });
    expect(result).toStrictEqual({ name: 'name' });
    expect(passwordLogin).toHaveBeenCalledWith({ username: 'test@example.com', password: 'test' });
  });

  it('should do nothing and return data if used is logged in', async () => {
    mock.onPost(`${apiUrl}/api/user/apps/${appId}/account`).reply(() => [201]);
    const userInfo: any = { sub: 'some-user-id' };
    const action = createTestAction({
      definition: {
        type: 'user.register',
        password: 'test',
        displayName: { prop: 'name' },
        email: 'test@example.com',
      },
      passwordLogin,
      getUserInfo: () => userInfo,
    });

    const result = await action({ name: 'name' });
    expect(result).toStrictEqual({ name: 'name' });
    expect(passwordLogin).not.toHaveBeenCalled();
  });
});

describe('user.login', () => {
  let passwordLogin: jest.Mock;

  beforeEach(() => {
    passwordLogin = jest.fn();
  });

  it('should log the user in', async () => {
    const userInfo: any = undefined;
    const action = createTestAction({
      definition: {
        type: 'user.login',
        password: 'test',
        email: 'test@example.com',
      },
      passwordLogin,
      getUserInfo: () => userInfo,
    });

    const result = await action({ name: 'name' });
    expect(result).toStrictEqual({ name: 'name' });
    expect(passwordLogin).toHaveBeenCalledWith({ username: 'test@example.com', password: 'test' });
  });

  it('should do nothing and return the data if the user is logged in', async () => {
    const userInfo: any = { sub: 'some-user-id' };
    const action = createTestAction({
      definition: {
        type: 'user.login',
        password: 'test',
        email: 'test@example.com',
      },
      passwordLogin,
      getUserInfo: () => userInfo,
    });

    const result = await action({ name: 'name' });
    expect(result).toStrictEqual({ name: 'name' });
    expect(passwordLogin).not.toHaveBeenCalled();
  });
});

describe('user.update', () => {
  let mock: MockAdapter;
  let setUserInfo: jest.Mock;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    setUserInfo = jest.fn();
  });

  it('should call the API for updating the user', async () => {
    mock.onPatch(`${apiUrl}/api/user/apps/${appId}/account`).reply(() => [
      201,
      {
        id: 'some-user-id',
        email: 'test2@example.com',
        email_verified: false,
        name: 'name',
        picture: `${apiUrl}/api/apps/${appId}/members/some-user-id/picture`,
      },
    ]);
    const userInfo: any = {
      sub: 'some-user-id',
      name: 'old name',
      email: 'test@example.com',
      email_verified: true,
      picture: 'https://example.com/old-avatar.jpg',
      role: 'Test role',
    };
    const action = createTestAction({
      definition: {
        type: 'user.update',
        displayName: { prop: 'name' },
        email: 'test2@example.com',
      },
      getUserInfo: () => userInfo,
      setUserInfo,
    });

    const result = await action({ name: 'name', foo: 123 });
    expect(result).toStrictEqual({ name: 'name', foo: 123 });
    expect(setUserInfo).toHaveBeenCalledWith({
      role: userInfo.role,
      sub: 'some-user-id',
      email: 'test2@example.com',
      email_verified: false,
      name: 'name',
      picture: `${apiUrl}/api/apps/${appId}/members/some-user-id/picture`,
    });
  });

  it('should do nothing and return the data if the user is not logged in', async () => {
    const userInfo: any = undefined;
    const action = createTestAction({
      definition: {
        type: 'user.update',
        displayName: { prop: 'name' },
        email: 'test@example.com',
      },
      getUserInfo: () => userInfo,
    });

    const result = await action({ name: 'name' });
    expect(result).toStrictEqual({ name: 'name' });
    expect(setUserInfo).not.toHaveBeenCalled();
  });
});
