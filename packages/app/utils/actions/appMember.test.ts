import { PredefinedAppRole } from '@appsemble/lang-sdk';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { createTestAction } from '../makeActions.js';
import { apiUrl, appId } from '../settings.js';

// TODO check and fix all

describe('app.member.register', () => {
  let mock: MockAdapter;
  let passwordLogin: Mock;
  let refetchDemoAppMembers: Mock;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    passwordLogin = vi.fn();
    refetchDemoAppMembers = vi.fn();
  });

  it('should call the API to register a new app member', async () => {
    mock.onPost(`${apiUrl}/api/apps/${appId}/auth/email/register`).reply(() => [201]);
    const action = createTestAction({
      definition: {
        type: 'app.member.register',
        password: 'test',
        name: { prop: 'name' },
        email: 'test@example.com',
        properties: { static: { test: [1, 2, 3], property: 'Property', bool: true } },
      },
      passwordLogin,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      // eslint-disable-next-line unicorn/no-useless-undefined
      getAppMemberInfo: () => undefined,
      refetchDemoAppMembers,
    });

    const result = await action({ name: 'name' });
    expect(result).toStrictEqual({ name: 'name' });
    expect(passwordLogin).toHaveBeenCalledWith({
      username: 'test@example.com',
      password: 'test',
    });
    expect(refetchDemoAppMembers).toHaveBeenCalledWith();
  });

  it('should do nothing and return data if user is logged in', async () => {
    mock.onPost(`${apiUrl}/api/apps/${appId}/auth/email/register`).reply(() => [201]);
    const action = createTestAction({
      definition: {
        type: 'app.member.register',
        password: 'test',
        name: { prop: 'name' },
        email: 'test@example.com',
      },
      passwordLogin,
      getAppMemberInfo: () => ({
        sub: 'some-user-id',
        email: 'test@example.com',
        email_verified: true,
        name: 'name',
        role: PredefinedAppRole.Member,
        demo: false,
        $seed: false,
        $ephemeral: false,
      }),
      refetchDemoAppMembers,
    });

    const result = await action({ name: 'name' });
    expect(result).toStrictEqual({ name: 'name' });
    expect(passwordLogin).not.toHaveBeenCalled();
    expect(refetchDemoAppMembers).not.toHaveBeenCalled();
  });
});

describe('app.member.invite', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axios);
  });

  it('should call the API to invite a new app member', async () => {
    mock.onPost(`${apiUrl}/api/apps/${appId}/invites`).reply(() => [201]);
    const action = createTestAction({
      definition: {
        type: 'app.member.invite',
        email: { prop: 'email' },
        role: { prop: 'role' },
      },
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      // eslint-disable-next-line unicorn/no-useless-undefined
      getAppMemberSelectedGroup: () => undefined,
      getAppMemberInfo: () => ({
        sub: 'some-user-id',
        email: 'test@example.com',
        email_verified: true,
        name: 'name',
        role: PredefinedAppRole.MembersManager,
        demo: false,
        $seed: false,
        $ephemeral: false,
      }),
    });

    const result = await action({ email: 'test@example.com', role: PredefinedAppRole.Member });
    expect(result).toStrictEqual({ email: 'test@example.com', role: PredefinedAppRole.Member });
  });

  it('should do nothing and return data if app member is not logged in', async () => {
    mock.onPost(`${apiUrl}/api/apps/${appId}/auth/email/register`).reply(() => [201]);
    const action = createTestAction({
      definition: {
        type: 'app.member.invite',
        email: { prop: 'email' },
        role: { prop: 'role' },
      },
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      // eslint-disable-next-line unicorn/no-useless-undefined
      getAppMemberSelectedGroup: () => undefined,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      getAppMemberInfo: () => null,
    });

    const result = await action({ email: 'test@example.com', role: PredefinedAppRole.Member });
    expect(result).toStrictEqual({ email: 'test@example.com', role: PredefinedAppRole.Member });
  });
});

describe('app.member.login', () => {
  let passwordLogin: Mock;
  let refetchDemoAppMembers: Mock;

  beforeEach(() => {
    passwordLogin = vi.fn();
    refetchDemoAppMembers = vi.fn();
  });

  it('should log the user in', async () => {
    const action = createTestAction({
      definition: {
        type: 'app.member.login',
        password: 'test',
        email: 'test@example.com',
      },
      passwordLogin,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      // eslint-disable-next-line unicorn/no-useless-undefined
      getAppMemberInfo: () => undefined,
      refetchDemoAppMembers,
    });

    const result = await action({ name: 'name' });
    expect(result).toStrictEqual({ name: 'name' });
    expect(passwordLogin).toHaveBeenCalledWith({ username: 'test@example.com', password: 'test' });
    expect(refetchDemoAppMembers).toHaveBeenCalledWith();
  });

  it('should do nothing and return the data if the user is logged in', async () => {
    const action = createTestAction({
      definition: {
        type: 'app.member.login',
        password: 'test',
        email: 'test@example.com',
      },
      passwordLogin,
      getAppMemberInfo: () => ({
        sub: 'some-user-id',
        email: 'test@example.com',
        email_verified: true,
        name: 'name',
        role: PredefinedAppRole.Member,
        demo: false,
        $seed: false,
        $ephemeral: false,
      }),
      refetchDemoAppMembers,
    });

    const result = await action({ name: 'name' });
    expect(result).toStrictEqual({ name: 'name' });
    expect(passwordLogin).not.toHaveBeenCalled();
    expect(refetchDemoAppMembers).not.toHaveBeenCalled();
  });
});

describe('app.member.query', () => {
  let mock: MockAdapter;
  let setAppMemberInfo: Mock;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    setAppMemberInfo = vi.fn();
  });

  it('should call the API for getting all app members by roles', async () => {
    mock.onGet(`${apiUrl}/api/apps/${appId}/members?roles=Role1,Role2,Role3`).reply(() => [
      200,
      [
        {
          id: 'role-1-id',
          email: 'role1@gmail.com',
          emailVerified: false,
          name: 'name',
          picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
          properties: {},
        },
        {
          id: 'role-2-id',
          email: 'role2@gmail.com',
          emailVerified: false,
          name: 'name',
          picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
          properties: {},
        },
        {
          id: 'role-3-id',
          email: 'role3@gmail.com',
          emailVerified: false,
          name: 'name',
          picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
          properties: {},
        },
      ],
    ]);

    const action = createTestAction({
      definition: {
        type: 'app.member.query',
        roles: {
          'array.from': ['Role1', 'Role2', 'Role3'],
        },
      },
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      // eslint-disable-next-line unicorn/no-useless-undefined
      getAppMemberSelectedGroup: () => undefined,
      getAppMemberInfo: () => ({
        sub: 'manager-id',
        name: 'name',
        email: 'manager@gmail.com',
        email_verified: true,
        picture: 'https://example.com/avatar.jpg',
        properties: {},
        role: PredefinedAppRole.MembersManager,
        demo: false,
        $seed: false,
        $ephemeral: false,
      }),
      setAppMemberInfo,
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
        picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
        properties: {},
      },
      {
        id: 'role-2-id',
        email: 'role2@gmail.com',
        emailVerified: false,
        name: 'name',
        picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
        properties: {},
      },
      {
        id: 'role-3-id',
        email: 'role3@gmail.com',
        emailVerified: false,
        name: 'name',
        picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
        properties: {},
      },
    ]);
  });

  it('should call the API for getting all app members by undefined roles', async () => {
    mock.onGet(`${apiUrl}/api/apps/${appId}/members?roles=`).reply(() => [
      200,
      [
        {
          id: 'role-1-id',
          email: 'role1@gmail.com',
          emailVerified: false,
          name: 'name',
          picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
          properties: {},
        },
        {
          id: 'role-2-id',
          email: 'role2@gmail.com',
          emailVerified: false,
          name: 'name',
          picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
          properties: {},
        },
        {
          id: 'role-3-id',
          email: 'role3@gmail.com',
          emailVerified: false,
          name: 'name',
          picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
          properties: {},
        },
      ],
    ]);

    const action = createTestAction({
      definition: {
        type: 'app.member.query',
        roles: null,
      },
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      // eslint-disable-next-line unicorn/no-useless-undefined
      getAppMemberSelectedGroup: () => undefined,
      getAppMemberInfo: () => ({
        sub: 'manager-id',
        name: 'name',
        email: 'manager@gmail.com',
        email_verified: true,
        picture: 'https://example.com/avatar.jpg',
        properties: {},
        role: PredefinedAppRole.MembersManager,
        demo: false,
        $seed: false,
        $ephemeral: false,
      }),
      setAppMemberInfo,
    });

    const result = await action();
    expect(result).toStrictEqual([
      {
        id: 'role-1-id',
        email: 'role1@gmail.com',
        emailVerified: false,
        name: 'name',
        picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
        properties: {},
      },
      {
        id: 'role-2-id',
        email: 'role2@gmail.com',
        emailVerified: false,
        name: 'name',
        picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
        properties: {},
      },
      {
        id: 'role-3-id',
        email: 'role3@gmail.com',
        emailVerified: false,
        name: 'name',
        picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
        properties: {},
      },
    ]);
  });

  it('should call the API for getting all demo app members by roles if the app member is demo', async () => {
    mock.onGet(`${apiUrl}/api/apps/${appId}/demo-members?roles=Role1,Role2,Role3`).reply(() => [
      200,
      [
        {
          id: 'role-1-id',
          email: 'role1@gmail.com',
          emailVerified: false,
          name: 'name',
          picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
          properties: {},
        },
        {
          id: 'role-2-id',
          email: 'role2@gmail.com',
          emailVerified: false,
          name: 'name',
          picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
          properties: {},
        },
        {
          id: 'role-3-id',
          email: 'role3@gmail.com',
          emailVerified: false,
          name: 'name',
          picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
          properties: {},
        },
      ],
    ]);

    const action = createTestAction({
      definition: {
        type: 'app.member.query',
        roles: {
          'array.from': ['Role1', 'Role2', 'Role3'],
        },
      },
      getAppMemberInfo: () => ({
        sub: 'manager-id',
        name: 'name',
        email: 'manager@gmail.com',
        email_verified: true,
        picture: 'https://example.com/avatar.jpg',
        properties: {},
        role: PredefinedAppRole.MembersManager,
        demo: true,
        $seed: false,
        $ephemeral: false,
      }),
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      // eslint-disable-next-line unicorn/no-useless-undefined
      getAppMemberSelectedGroup: () => undefined,
      setAppMemberInfo,
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
        picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
        properties: {},
      },
      {
        id: 'role-2-id',
        email: 'role2@gmail.com',
        emailVerified: false,
        name: 'name',
        picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
        properties: {},
      },
      {
        id: 'role-3-id',
        email: 'role3@gmail.com',
        emailVerified: false,
        name: 'name',
        picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
        properties: {},
      },
    ]);
  });

  it('should do nothing and return the data if the user is not logged in', async () => {
    const action = createTestAction({
      definition: {
        type: 'app.member.query',
        roles: {
          'array.from': ['Role1', 'Role2', 'Role3'],
        },
      },
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      getAppMemberInfo: () => null,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      // eslint-disable-next-line unicorn/no-useless-undefined
      getAppMemberSelectedGroup: () => undefined,
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

describe('app.member.current.patch', () => {
  let mock: MockAdapter;
  let setAppMemberInfo: Mock;
  let refetchDemoAppMembers: Mock;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    setAppMemberInfo = vi.fn();
    refetchDemoAppMembers = vi.fn();
  });

  it('should call the API for patching the app member', async () => {
    mock.onPatch(`${apiUrl}/api/apps/${appId}/members/current`).reply(() => [200]);
    mock.onGet(`${apiUrl}/api/apps/${appId}/members/current`).reply(() => [
      200,
      {
        id: 'some-user-id',
        email: 'email@example.com',
        emailVerified: false,
        name: 'name',
        picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
        properties: { test: '[1,2,3]', property: 'Property', bool: 'true' },
      },
    ]);
    const action = createTestAction({
      definition: {
        type: 'app.member.current.patch',
        name: { prop: 'name' },
        properties: { static: { test: [1, 2, 3], property: 'Property', bool: true } },
      },
      getAppMemberInfo: () => ({
        sub: 'some-user-id',
        name: 'old name',
        email: 'email@example.com',
        email_verified: true,
        picture: 'https://example.com/old-avatar.jpg',
        properties: { test: [1, 2, 3], property: 'Property', bool: true },
        role: PredefinedAppRole.Member,
        demo: false,
        $seed: false,
        $ephemeral: false,
      }),
      setAppMemberInfo,
      refetchDemoAppMembers,
    });

    const result = await action({ name: 'name' });
    expect(result).toStrictEqual({
      id: 'some-user-id',
      name: 'name',
      email: 'email@example.com',
      emailVerified: false,
      picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
      properties: {
        bool: 'true',
        property: 'Property',
        test: '[1,2,3]',
      },
    });
    expect(setAppMemberInfo).toHaveBeenCalledWith({
      id: 'some-user-id',
      email: 'email@example.com',
      emailVerified: false,
      name: 'name',
      picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
      properties: { test: '[1,2,3]', property: 'Property', bool: 'true' },
    });
    expect(refetchDemoAppMembers).toHaveBeenCalledWith();
  });

  it('should do nothing and return the data if the user is not logged in', async () => {
    const action = createTestAction({
      definition: {
        type: 'app.member.current.patch',
        name: { prop: 'name' },
      },
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      // eslint-disable-next-line unicorn/no-useless-undefined
      getAppMemberInfo: () => undefined,
    });

    const result = await action({ name: 'name' });
    expect(result).toStrictEqual({ name: 'name' });
    expect(setAppMemberInfo).not.toHaveBeenCalled();
    expect(refetchDemoAppMembers).not.toHaveBeenCalled();
  });

  it('should update another app member if called by account manager', async () => {
    mock.onPatch(`${apiUrl}/api/apps/${appId}/members/current`).reply(() => [200]);
    mock.onGet(`${apiUrl}/api/apps/${appId}/members/current`).reply(() => [
      200,
      {
        id: 'some-user-id',
        email: 'example@email.com',
        emailVerified: false,
        name: 'name',
        picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
        properties: { test: '[1,2,3]', property: 'Property', bool: 'true' },
      },
    ]);
    const action = createTestAction({
      definition: {
        type: 'app.member.current.patch',
        name: { prop: 'name' },
        properties: { static: { test: [1, 2, 3], property: 'Property', bool: true } },
      },
      getAppMemberInfo: () => ({
        sub: 'some-user-id',
        name: 'old name',
        email: 'example@email.com',
        email_verified: true,
        picture: 'https://example.com/old-avatar.jpg',
        properties: {},
        role: PredefinedAppRole.Member,
        demo: false,
        $seed: false,
        $ephemeral: false,
      }),
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      // eslint-disable-next-line unicorn/no-useless-undefined
      getAppMemberSelectedGroup: () => undefined,
      setAppMemberInfo,
      refetchDemoAppMembers,
    });

    const result = await action({ name: 'name' });
    expect(result).toStrictEqual({
      id: 'some-user-id',
      name: 'name',
      email: 'example@email.com',
      emailVerified: false,
      picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
      properties: {
        bool: 'true',
        property: 'Property',
        test: '[1,2,3]',
      },
    });
    expect(refetchDemoAppMembers).toHaveBeenCalledWith();
  });
});

describe('app.member.role.update', () => {
  let mock: MockAdapter;
  let refetchDemoAppMembers: Mock;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    refetchDemoAppMembers = vi.fn();
  });

  it('should call the API for updating the role of the app member', async () => {
    mock.onPut(`${apiUrl}/api/apps/${appId}/app-members/some-user-id/role`).reply(() => [
      201,
      {
        id: 'some-user-id',
        email: 'email@example.com',
        emailVerified: false,
        name: 'name',
        role: PredefinedAppRole.Member,
        picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
        properties: { test: '[1,2,3]', property: 'Property', bool: 'true' },
      },
    ]);
    const action = createTestAction({
      definition: {
        type: 'app.member.role.update',
        sub: 'some-user-id',
        role: { prop: 'role' },
      },
      getAppMemberInfo: () => ({
        sub: 'manager-id',
        name: 'old name',
        email: 'email@example.com',
        email_verified: true,
        picture: 'https://example.com/old-avatar.jpg',
        properties: { test: [1, 2, 3], property: 'Property', bool: true },
        role: PredefinedAppRole.MembersManager,
        demo: false,
        $seed: false,
        $ephemeral: false,
      }),
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      // eslint-disable-next-line unicorn/no-useless-undefined
      getAppMemberSelectedGroup: () => undefined,
      refetchDemoAppMembers,
    });

    const result = await action({ role: PredefinedAppRole.Member });
    expect(result).toStrictEqual({
      id: 'some-user-id',
      name: 'name',
      email: 'email@example.com',
      emailVerified: false,
      picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
      role: PredefinedAppRole.Member,
      properties: {
        bool: 'true',
        property: 'Property',
        test: '[1,2,3]',
      },
    });
    expect(refetchDemoAppMembers).toHaveBeenCalledWith();
  });

  it('should do nothing and return the data if the user is not logged in', async () => {
    const action = createTestAction({
      definition: {
        type: 'app.member.role.update',
        sub: 'some-user-id',
        role: PredefinedAppRole.ResourcesManager,
      },
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      // eslint-disable-next-line unicorn/no-useless-undefined
      getAppMemberInfo: () => undefined,
    });

    const result = await action({ name: 'name' });
    expect(result).toStrictEqual({ name: 'name' });
    expect(refetchDemoAppMembers).not.toHaveBeenCalled();
  });
});

describe('app.member.properties.patch', () => {
  let mock: MockAdapter;
  let refetchDemoAppMembers: Mock;
  const currentEmail = 'test@gmail.com';

  beforeEach(() => {
    mock = new MockAdapter(axios);
    refetchDemoAppMembers = vi.fn();
  });

  it('should call the API for patching the app member', async () => {
    mock.onPatch(`${apiUrl}/api/apps/${appId}/app-members/some-user-id/properties`).reply(() => [
      201,
      {
        id: 'some-user-id',
        email: currentEmail,
        emailVerified: false,
        name: 'name',
        picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
        properties: { test: '[1,2,3]', property: 'Property', bool: 'true' },
      },
    ]);
    const action = createTestAction({
      definition: {
        type: 'app.member.properties.patch',
        sub: 'some-user-id',
        properties: { static: { test: [1, 2, 3], property: 'Property', bool: true } },
      },
      getAppMemberInfo: () => ({
        sub: 'manager-id',
        name: 'old name',
        email: currentEmail,
        email_verified: true,
        picture: 'https://example.com/old-avatar.jpg',
        properties: { test: [1, 2, 3], property: 'Property', bool: true },
        role: PredefinedAppRole.Member,
        demo: false,
        $seed: false,
        $ephemeral: false,
      }),
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      // eslint-disable-next-line unicorn/no-useless-undefined
      getAppMemberSelectedGroup: () => undefined,
      refetchDemoAppMembers,
    });

    const result = await action({ name: 'name' });
    expect(result).toStrictEqual({
      id: 'some-user-id',
      name: 'name',
      email: currentEmail,
      emailVerified: false,
      picture: `${apiUrl}/api/apps/${appId}/app-members/some-user-id/picture`,
      properties: {
        bool: 'true',
        property: 'Property',
        test: '[1,2,3]',
      },
    });
    expect(refetchDemoAppMembers).toHaveBeenCalledWith();
  });

  it('should do nothing and return the data if the user is not logged in', async () => {
    const action = createTestAction({
      definition: {
        type: 'app.member.properties.patch',
        sub: 'some-user-id',
        properties: { static: { test: [1, 2, 3], property: 'Property', bool: true } },
      },
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      // eslint-disable-next-line unicorn/no-useless-undefined
      getAppMemberSelectedGroup: () => undefined,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      // eslint-disable-next-line unicorn/no-useless-undefined
      getAppMemberInfo: () => undefined,
    });

    const result = await action({ name: 'name' });
    expect(result).toStrictEqual({ name: 'name' });
    expect(refetchDemoAppMembers).not.toHaveBeenCalled();
  });
});

describe('app.member.delete', () => {
  let mock: MockAdapter;
  let refetchDemoAppMembers: Mock;
  const managerEmail = 'manager@gmail.com';
  const memberEmail = 'test@gmail.com';

  beforeEach(() => {
    mock = new MockAdapter(axios);
    refetchDemoAppMembers = vi.fn();
  });

  it('should call the API for removing a user', async () => {
    mock.onDelete(`${apiUrl}/api/apps/${appId}/app-members/some-user-id`).reply(() => [204, []]);

    const action = createTestAction({
      definition: {
        sub: 'some-user-id',
        type: 'app.member.delete',
      },
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      // eslint-disable-next-line unicorn/no-useless-undefined
      getAppMemberSelectedGroup: () => undefined,
      getAppMemberInfo: () => ({
        sub: 'manager-id',
        name: 'name',
        email: managerEmail,
        email_verified: true,
        picture: 'https://example.com/avatar.jpg',
        properties: {},
        role: PredefinedAppRole.MembersManager,
        demo: false,
        $seed: false,
        $ephemeral: false,
      }),
      refetchDemoAppMembers,
    });

    const result = await action({
      email: memberEmail,
    });
    expect(result).toStrictEqual([]);
    expect(refetchDemoAppMembers).toHaveBeenCalledWith();
  });

  it('should do nothing and return the data if the user is not logged in', async () => {
    const action = createTestAction({
      definition: {
        sub: 'some-user-id',
        type: 'app.member.delete',
      },
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      // eslint-disable-next-line unicorn/no-useless-undefined
      getAppMemberInfo: () => undefined,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      // eslint-disable-next-line unicorn/no-useless-undefined
      getAppMemberSelectedGroup: () => undefined,
    });

    const result = await action({
      email: memberEmail,
    });
    expect(result).toStrictEqual({
      email: memberEmail,
    });
    expect(refetchDemoAppMembers).not.toHaveBeenCalled();
  });
});
