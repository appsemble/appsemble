import { AppsembleError } from '@appsemble/node-utils';
import axios, { type AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import jwt from 'jsonwebtoken';
import { afterEach, describe, expect, it } from 'vitest';

import { getAccessToken, getUserInfo, hasScope } from './oauth2.js';

const mock = new MockAdapter(axios);

describe('oauth2', () => {
  afterEach(() => {
    mock.reset();
  });

  describe('hasScope', () => {
    it('should return true if the scopes are an exact match', () => {
      const result = hasScope('foo', 'foo');
      expect(result).toBe(true);
    });

    it('should return true if all required scopes exist in the granted scopes', () => {
      const result = hasScope('foo bar', 'foo');
      expect(result).toBe(true);
    });

    it('should return false if some of the required scopes aren’t granted', () => {
      const result = hasScope('foo', 'foo bar');
      expect(result).toBe(false);
    });
  });

  describe('getAccessToken', () => {
    it('should make an access token request', async () => {
      let config: AxiosRequestConfig;
      mock.onPost('https://example.com/token').reply((req) => {
        config = req;
        return [200, { access_token: 'token' }];
      });
      const result = await getAccessToken(
        'https://example.com/token',
        'test_code',
        'http://localhost/callback',
        'test_id',
        'test_secret',
      );
      expect(config.data).toBe(
        'grant_type=authorization_code&client_id=test_id&client_secret=test_secret&code=test_code&redirect_uri=http%3A%2F%2Flocalhost%2Fcallback',
      );
      expect(config.headers).toMatchObject({
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        authorization: 'Basic dGVzdF9pZDp0ZXN0X3NlY3JldA==',
      });
      expect(result).toStrictEqual({ access_token: 'token' });
    });
  });

  describe('getUserInfo', () => {
    it('should read information from the id token', async () => {
      const userInfo = await getUserInfo(
        '',
        jwt.sign(
          {
            email: 'me@example.com',
            email_verified: true,
            name: 'Me',
            picture: 'https://example.com/me.png',
            sub: '42',
            subscribed: false,
            zoneinfo: 'Europe/Amsterdam',
          },
          'secret',
        ),
      );
      expect(userInfo).toStrictEqual({
        email: 'me@example.com',
        email_verified: true,
        name: 'Me',
        picture: 'https://example.com/me.png',
        sub: '42',
        locale: undefined,
        subscribed: false,
        zoneinfo: 'Europe/Amsterdam',
      });
    });

    it('should fall back to the access token', async () => {
      const userInfo = await getUserInfo(
        jwt.sign({ sub: '1337' }, 'secret'),
        jwt.sign(
          {
            email: 'user@example.com',
            name: 'User',
            picture: 'https://example.com/user.png',
            locale: undefined,
            subscribed: false,
            zoneinfo: undefined,
          },
          'secret',
        ),
      );
      expect(userInfo).toStrictEqual({
        email: 'user@example.com',
        email_verified: false,
        name: 'User',
        picture: 'https://example.com/user.png',
        sub: '1337',
        subscribed: false,
        locale: undefined,
        zoneinfo: undefined,
      });
    });

    it('should fall back to user info endpoint', async () => {
      mock.onGet('/userinfo').reply(() => [
        200,
        {
          email: 'user@example.com',
          email_verified: false,
          name: 'User',
          picture: 'https://example.com/user.png',
          locale: undefined,
          subscribed: false,
          zoneinfo: undefined,
        },
      ]);
      const userInfo = await getUserInfo('', jwt.sign({ sub: '1337' }, 'secret'), '/userinfo');
      expect(userInfo).toStrictEqual({
        email: 'user@example.com',
        email_verified: false,
        name: 'User',
        picture: 'https://example.com/user.png',
        sub: '1337',
        locale: undefined,
        subscribed: false,
        zoneinfo: undefined,
      });
    });

    it('should support a remapper for the user info endpoint', async () => {
      mock.onGet('/user').reply(() => [
        200,
        {
          emailAddress: 'user@example.com',
          fullName: 'User',
          profileUrl: 'https://example.com/user',
          avatarUrl: 'https://example.com/user.png',
          userId: 1337,
          zoneinfo: undefined,
          subscribed: false,
        },
      ]);
      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
      const userInfo = await getUserInfo('', null, '/user', [
        {
          'object.from': {
            email: [{ prop: 'emailAddress' }],
            name: [{ prop: 'fullName' }],
            picture: [{ prop: 'avatarUrl' }],
            subscribed: false,
            sub: [{ prop: 'userId' }],
          },
        },
      ]);
      expect(userInfo).toStrictEqual({
        email: 'user@example.com',
        email_verified: false,
        name: 'User',
        picture: 'https://example.com/user.png',
        sub: '1337',
        subscribed: false,
        locale: undefined,
        zoneinfo: undefined,
      });
    });

    it('should throw if no subject could be found', async () => {
      await expect(getUserInfo('')).rejects.toThrow(
        new AppsembleError('No subject could be found while logging in using OAuth2'),
      );
    });
  });
});
