import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { createTestAction } from '../makeActions.js';
import { apiUrl } from '../settings.js';

describe('team.join', () => {
  let mock: MockAdapter;
  let updateTeam: jest.Mock;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    updateTeam = import.meta.jest.fn();
  });

  it('should join a team and update the state', async () => {
    mock
      .onPost(`${apiUrl}/api/apps/42/teams/1337/members`)
      .reply(() => [201, { id: 1337, role: 'member', annotations: {} }]);
    const action = createTestAction({
      definition: { type: 'team.join' },
      getUserInfo: () => ({ sub: 'some-uuid', name: '', email: '', email_verified: false }),
      updateTeam,
    });
    const result = await action(1337);
    expect(result).toStrictEqual({ id: 1337, role: 'member', annotations: {} });
    expect(updateTeam).toHaveBeenCalledWith({ id: 1337, role: 'member', annotations: {} });
  });

  it('should throw if the user is not logged in', async () => {
    const userInfo: any = undefined;
    const action = createTestAction({
      definition: { type: 'team.join' },
      getUserInfo: () => userInfo,
      updateTeam,
    });
    await expect(action(1337)).rejects.toThrow('User is not logged in');
  });
});

describe('team.list', () => {
  it('should return the user’s teams', async () => {
    const action = createTestAction({
      definition: { type: 'team.list' },
      teams: [{ id: 1337, name: 'IT', role: 'member', annotations: { foo: 'bar' } }],
    });
    const result = await action('Input data');
    expect(result).toStrictEqual([
      { id: 1337, name: 'IT', role: 'member', annotations: { foo: 'bar' } },
    ]);
  });
});

describe('team.members', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axios);
  });

  it('should get the members of the specified team', async () => {
    mock
      .onGet(`${apiUrl}/api/apps/42/teams/1337/members/some-uuid`)
      .reply(() => [200, { id: 1337, role: 'member', annotations: {} }]);
    mock
      .onGet(`${apiUrl}/api/apps/42/teams/1337/members`)
      .reply(() => [200, [{ id: 1337, role: 'member', annotations: {} }]]);

    const action = createTestAction({
      definition: { type: 'team.members', id: 1337 },
      teams: [{ id: 1337, name: 'IT', role: 'member' }],
      getUserInfo: () => ({ sub: 'some-uuid', name: '', email: '', email_verified: false }),
    });

    const result = await action();

    expect(result).toStrictEqual([{ id: 1337, role: 'member', annotations: {} }]);
  });

  it('should throw an error if the user isn’t in the team', async () => {
    mock.onGet(`${apiUrl}/api/apps/42/teams/1337/members`).reply(() => [200, []]);
    const action = createTestAction({
      definition: { type: 'team.members', id: 1337 },
      teams: [{ id: 1337, name: 'IT', role: 'member' }],
      getUserInfo: () => ({ sub: 'some-uuid', name: '', email: '', email_verified: false }),
    });

    await expect(action()).rejects.toThrow('User is not a member of the specified team');
  });

  it('should throw an error if the user is not logged in/valid', async () => {
    mock.onGet(`${apiUrl}/api/apps/42/teams/1337/members`).reply(() => [200, []]);
    const userInfo: any = undefined;
    const action = createTestAction({
      definition: { type: 'team.members', id: 1337 },
      teams: [{ id: 1337, name: 'IT', role: 'member' }],
      getUserInfo: () => userInfo,
    });

    await expect(action()).rejects.toThrow('User is not logged in');
  });
});
