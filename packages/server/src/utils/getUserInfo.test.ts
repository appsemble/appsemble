import { AppsembleError } from '@appsemble/node-utils';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { sign } from 'jsonwebtoken';

import getUserInfo from './getUserInfo';

const mock = new MockAdapter(axios);

afterEach(() => {
  mock.reset();
});

it('should read information from the id token', async () => {
  const userInfo = await getUserInfo(
    { authorizationUrl: '', icon: 'gitlab', name: '', scope: '', tokenUrl: '' },

    '',
    sign(
      {
        email: 'me@example.com',
        email_verified: true,
        name: 'Me',
        profile: 'https://example.com/me',
        picture: 'https://example.com/me.png',
        sub: '42',
      },
      'secret',
    ),
  );
  expect(userInfo).toStrictEqual({
    email: 'me@example.com',
    email_verified: true,
    name: 'Me',
    profile: 'https://example.com/me',
    picture: 'https://example.com/me.png',
    sub: '42',
  });
});

it('should fall back to the access token', async () => {
  const userInfo = await getUserInfo(
    { authorizationUrl: '', icon: 'gitlab', name: '', scope: '', tokenUrl: '' },
    sign({ sub: '1337' }, 'secret'),
    sign(
      {
        email: 'user@example.com',
        name: 'User',
        profile: 'https://example.com/user',
        picture: 'https://example.com/user.png',
      },
      'secret',
    ),
  );
  expect(userInfo).toStrictEqual({
    email: 'user@example.com',
    email_verified: false,
    name: 'User',
    profile: 'https://example.com/user',
    picture: 'https://example.com/user.png',
    sub: '1337',
  });
});

it('should fall back to user info endpoint', async () => {
  mock.onGet('/userinfo').reply(() => [
    200,
    {
      email: 'user@example.com',
      email_verified: false,
      name: 'User',
      profile: 'https://example.com/user',
      picture: 'https://example.com/user.png',
    },
  ]);
  const userInfo = await getUserInfo(
    {
      authorizationUrl: '',
      icon: 'gitlab',
      name: '',
      scope: '',
      tokenUrl: '',
      userInfoUrl: '/userinfo',
    },
    '',
    sign({ sub: '1337' }, 'secret'),
  );
  expect(userInfo).toStrictEqual({
    email: 'user@example.com',
    email_verified: false,
    name: 'User',
    profile: 'https://example.com/user',
    picture: 'https://example.com/user.png',
    sub: '1337',
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
    },
  ]);
  const userInfo = await getUserInfo(
    {
      authorizationUrl: '',
      icon: 'pizza',
      name: '',
      scope: '',
      tokenUrl: '',
      userInfoUrl: '/user',
      remapper: [
        {
          'object.from': {
            email: [{ prop: 'emailAddress' }],
            name: [{ prop: 'fullName' }],
            profile: [{ prop: 'profileUrl' }],
            picture: [{ prop: 'avatarUrl' }],
            sub: [{ prop: 'userId' }],
          },
        },
      ],
    },
    '',
  );
  expect(userInfo).toStrictEqual({
    email: 'user@example.com',
    email_verified: false,
    name: 'User',
    profile: 'https://example.com/user',
    picture: 'https://example.com/user.png',
    sub: '1337',
  });
});

it('should throw if no subject could be found', async () => {
  await expect(
    getUserInfo(
      { authorizationUrl: '', icon: 'gitlab', name: '', scope: '', tokenUrl: '' },
      '',
      '',
    ),
  ).rejects.toThrow(new AppsembleError('No subject could be found while logging in using OAuth2'));
});
