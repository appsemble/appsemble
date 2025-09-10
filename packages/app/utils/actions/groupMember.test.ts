import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTestAction } from '../makeActions.js';

let mock: MockAdapter;

beforeEach(() => {
  mock = new MockAdapter(axios);
});

afterEach(() => {
  mock.restore();
});

describe('groupMemberInvite', () => {
  it('should return the invited member', async () => {
    mock
      .onPost(/.*/)
      .reply(() => [
        200,
        { id: 'random-id', role: 'Member', name: 'Test Member', email: 'test2@example.com' },
      ]);
    const action = createTestAction({
      definition: {
        type: 'group.member.invite',
        id: 'random-id',
        email: 'test2@example.com',
        role: 'Member',
      },
      getAppMemberInfo: () => ({
        sub: 'random-id',
        name: 'Test Member',
        role: 'Member',
        email: 'test2@example.com',
        demo: false,
        email_verified: true,
        $seed: false,
        $ephemeral: false,
      }),
      getAppMemberSelectedGroup: () => ({
        id: 1,
        name: 'Test Group',
        role: 'Member',
      }),
    });
    const result = await action(1);
    expect(result).toMatchObject({
      id: 'random-id',
      role: 'Member',
      name: 'Test Member',
      email: 'test2@example.com',
    });
  });

  it('should return input data if the app member is not logged in', async () => {
    const action = createTestAction({
      definition: {
        type: 'group.member.invite',
        id: 'random-id',
        email: 'test2@example.com',
        role: 'Member',
      },
      // @ts-expect-error 2322 undefined is not assignable to type (strictNullChecks)
      getAppMemberInfo: () => ({
        sub: undefined,
        name: '',
        role: '',
        email: '',
        demo: false,
        email_verified: false,
      }),
      getAppMemberSelectedGroup: () => ({
        id: 1,
        name: 'Test Group',
        role: 'Member',
      }),
    });
    const result = await action({ foo: 'bar' });
    expect(result).toStrictEqual({ foo: 'bar' });
  });
});

describe('groupMemberQuery', () => {
  it('should return members of a group', async () => {
    mock
      .onGet(/.*/)
      .reply(() => [
        200,
        [{ id: 'random-id', role: 'Member', name: 'Test Member', email: 'test@example.com' }],
      ]);
    const action = createTestAction({
      definition: {
        type: 'group.member.query',
        id: 1,
      },
      getAppMemberInfo: () => ({
        sub: 'random-id',
        name: 'Test Member',
        role: 'Member',
        email: 'test2@example.com',
        demo: false,
        email_verified: true,
        $seed: false,
        $ephemeral: false,
      }),
      getAppMemberSelectedGroup: () => ({
        id: 1,
        name: 'Test Group',
        role: 'Member',
      }),
    });
    const result = await action(1);
    expect(result).toMatchObject([
      {
        id: 'random-id',
        role: 'Member',
        name: 'Test Member',
        email: 'test@example.com',
      },
    ]);
  });

  it('should return input data if the app member is not logged in', async () => {
    const action = createTestAction({
      definition: {
        type: 'group.member.query',
        id: 1,
      },
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      getAppMemberInfo: () => ({
        sub: undefined,
        name: '',
        role: '',
        email: '',
        demo: false,
        email_verified: false,
      }),
      getAppMemberSelectedGroup: () => ({
        id: 1,
        name: 'Test Group',
        role: 'Member',
      }),
    });
    const result = await action({ foo: 'bar' });
    expect(result).toStrictEqual({ foo: 'bar' });
  });
});

describe('GroupMemberDelete', () => {
  it('should return input data if the app member is not logged in', async () => {
    const action = createTestAction({
      definition: {
        type: 'group.member.delete',
        id: 'random-id',
      },
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      getAppMemberInfo: () => ({
        sub: undefined,
        name: '',
        role: '',
        email: '',
        demo: false,
        email_verified: false,
      }),
      getAppMemberSelectedGroup: () => ({
        id: 1,
        name: 'Test Group',
        role: 'Member',
      }),
    });
    const result = await action({
      foo: 'bar',
    });
    expect(result).toStrictEqual({
      foo: 'bar',
    });
  });
});

describe('GroupMemberRoleUpdate', () => {
  it('should return the updated app member', async () => {
    mock
      .onPut(/.*/)
      .reply(() => [
        200,
        { id: 'random-id', role: 'Manager', name: 'Test Member', email: 'test@example.com' },
      ]);
    const action = createTestAction({
      definition: {
        type: 'group.member.role.update',
        role: 'Manager',
        id: 'random-id',
      },
      getAppMemberInfo: () => ({
        sub: 'random-id',
        name: 'Test Member',
        role: 'Member',
        email: 'test2@example.com',
        demo: false,
        email_verified: true,
        $seed: false,
        $ephemeral: false,
      }),
      getAppMemberSelectedGroup: () => ({
        id: 1,
        name: 'Test Group',
        role: 'Member',
      }),
    });
    const result = await action(1);
    expect(result).toMatchObject({
      id: 'random-id',
      role: 'Manager',
      name: 'Test Member',
      email: 'test@example.com',
    });
  });
});
