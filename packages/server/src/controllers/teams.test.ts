import { TeamRole } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';

import { App, AppMember, Member, Organization, Team, TeamMember, User } from '../models';
import { setArgv } from '../utils/argv';
import { createServer } from '../utils/createServer';
import { authorizeStudio, createTestUser } from '../utils/test/authorization';
import { useTestDatabase } from '../utils/test/testSchema';

let organization: Organization;
let app: App;
let user: User;

useTestDatabase('teams');

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

beforeEach(async () => {
  user = await createTestUser();
  organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  app = await App.create({
    definition: {
      name: 'Test App',
      defaultPage: 'Test Page',
      security: {
        default: {
          role: 'Reader',
          policy: 'everyone',
        },
        roles: {
          Reader: {},
        },
      },
    },
    path: 'test-app',
    vapidPublicKey: 'a',
    vapidPrivateKey: 'b',
    OrganizationId: organization.id,
  });

  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });
});

describe('getTeams', () => {
  it('should return an empty array', async () => {
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/teams`);

    expect(response).toMatchObject({
      status: 200,
      data: [],
    });
  });

  it('should return a list of teams', async () => {
    const teamA = await Team.create({ name: 'A', AppId: app.id });
    const teamB = await Team.create({ name: 'B', AppId: app.id });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/teams`);

    expect(response).toMatchObject({
      status: 200,
      data: [
        { id: teamA.id, name: teamA.name },
        { id: teamB.id, name: teamB.name },
      ],
    });
  });

  it('should include the role of the user', async () => {
    const teamA = await Team.create({ name: 'A', AppId: app.id });
    const teamB = await Team.create({ name: 'B', AppId: app.id });
    const teamC = await Team.create({ name: 'C', AppId: app.id });

    await TeamMember.bulkCreate([
      { role: TeamRole.Member, UserId: user.id, TeamId: teamA.id },
      { role: TeamRole.Manager, UserId: user.id, TeamId: teamB.id },
    ]);

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/teams`);

    expect(response).toMatchObject({
      status: 200,
      data: [
        { id: teamA.id, name: teamA.name, role: TeamRole.Member },
        { id: teamB.id, name: teamB.name, role: TeamRole.Manager },
        { id: teamC.id, name: teamC.name },
      ],
    });
  });
});

describe('getTeam', () => {
  it('should return a team', async () => {
    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({ role: TeamRole.Member, UserId: user.id, TeamId: team.id });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/teams/${team.id}`);
    expect(response).toMatchObject({
      status: 200,
      data: { id: team.id, name: team.name, role: TeamRole.Member },
    });
  });

  it('should not return a team that doesn’t exist', async () => {
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/teams/80000`);

    expect(response).toMatchObject({
      status: 404,
      data: { message: 'Team not found.' },
    });
  });

  it('should not return a team for another app', async () => {
    const team = await Team.create({ name: 'A', AppId: app.id });
    const appB = await App.create({
      definition: {
        name: 'Test App 2',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
          },
        },
      },
      path: 'test-app-2',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    authorizeStudio();
    const response = await request.get(`/api/apps/${appB.id}/teams/${team.id}`);

    expect(response).toMatchObject({
      status: 404,
      data: { message: 'Team not found.' },
    });
  });
});

describe('createTeam', () => {
  it('should create a team if user is Owner', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/teams`, {
      name: 'Test Team',
    });

    expect(response).toMatchObject({
      status: 201,
      data: { id: expect.any(Number), name: 'Test Team', role: TeamRole.Manager },
    });
  });

  it('should create a team with annotations', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/teams`, {
      name: 'Test Team',
      annotations: { testKey: 'foo' },
    });

    expect(response).toMatchObject({
      status: 201,
      data: {
        id: expect.any(Number),
        name: 'Test Team',
        role: TeamRole.Manager,
        annotations: { testKey: 'foo' },
      },
    });
  });

  it('should not create a team if teams are not used or usable', async () => {
    const noSecurity = await App.create({
      definition: {
        name: 'No Security App',
        defaultPage: 'Test Page',
      },
      path: 'no-security-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    authorizeStudio();
    const response = await request.post(`/api/apps/${noSecurity.id}/teams`, { name: 'Test Team' });

    expect(response).toMatchObject({
      status: 400,
      data: { message: 'App does not have a security definition.' },
    });
  });

  it('should not create a team if user is not an Owner', async () => {
    await Member.update(
      { role: 'AppEditor' },
      { where: { UserId: user.id, OrganizationId: organization.id } },
    );
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/teams`, { name: 'Test Team' });

    expect(response).toMatchObject({
      status: 403,
      data: { message: 'User does not have sufficient permissions.' },
    });
  });

  it('should not create a team if user is not part of the organization', async () => {
    await Organization.create({
      id: 'appsemble',
      name: 'Appsemble',
    });
    const appB = await App.create({
      definition: {
        name: 'Test App 2',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
          },
        },
      },
      path: 'test-app-2',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: 'appsemble',
    });
    authorizeStudio();
    const response = await request.post(`/api/apps/${appB.id}/teams`, { name: 'Test Team' });

    expect(response).toMatchObject({
      status: 403,
      data: { message: 'User is not part of this organization.' },
    });
  });

  it('should not create a team for non-existent organizations', async () => {
    authorizeStudio();
    const response = await request.post('/api/apps/80123/teams', { name: 'Test Team' });

    expect(response).toMatchObject({
      status: 404,
      data: { message: 'App not found.' },
    });
  });
});

describe('patchTeam', () => {
  it('should update the name of the team', async () => {
    const team = await Team.create({ name: 'A', AppId: app.id });
    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}/teams/${team.id}`, { name: 'B' });
    const responseB = await request.get<Team>(`/api/apps/${app.id}/teams/${team.id}`);

    expect(response).toMatchObject({ status: 200, data: { id: team.id, name: 'B' } });
    expect(responseB.data.name).toBe('B');
  });

  it('should update annotations', async () => {
    const team = await Team.create({ name: 'A', AppId: app.id });
    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}/teams/${team.id}`, {
      name: 'B',
      annotations: { testKey: 'foo' },
    });
    const responseB = await request.get(`/api/apps/${app.id}/teams/${team.id}`);

    expect(response).toMatchObject({
      status: 200,
      data: { id: team.id, name: 'B', annotations: { testKey: 'foo' } },
    });
    expect(responseB.data).toMatchObject({
      id: team.id,
      name: 'B',
      annotations: { testKey: 'foo' },
    });
  });

  it('should not update without sufficient permissions', async () => {
    await Member.update(
      { role: 'AppEditor' },
      { where: { UserId: user.id, OrganizationId: organization.id } },
    );
    const team = await Team.create({ name: 'A', AppId: app.id });
    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}/teams/${team.id}`, { name: 'B' });

    expect(response).toMatchObject({
      status: 403,
      data: { message: 'User does not have sufficient permissions.' },
    });
  });

  it('should not update a non-existent team', async () => {
    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}/teams/80000`, { name: 'B' });

    expect(response).toMatchObject({ status: 404, data: { message: 'Team not found.' } });
  });

  it('should not update a team from another organization', async () => {
    const org = await Organization.create({
      id: 'testorganization2',
      name: 'Test Organization',
    });
    const appB = await App.create({
      definition: {
        name: 'Test App 2',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
          },
        },
      },
      path: 'test-app-2',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: org.id,
    });
    const team = await Team.create({ name: 'A', AppId: appB.id });
    authorizeStudio();
    const response = await request.patch(`/api/apps/${appB.id}/teams/${team.id}`, { name: 'B' });

    expect(response).toMatchObject({
      status: 403,
      data: { message: 'User is not part of this organization.' },
    });
  });
});

describe('deleteTeam', () => {
  it('should delete a team', async () => {
    const team = await Team.create({ name: 'A', AppId: app.id });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/teams/${team.id}`);
    const responseB = await request.get(`/api/apps/${app.id}/teams`);

    expect(response.status).toBe(204);
    expect(responseB.data).toStrictEqual([]);
  });

  it('should not delete without sufficient permissions', async () => {
    await Member.update(
      { role: 'AppEditor' },
      { where: { UserId: user.id, OrganizationId: organization.id } },
    );
    const team = await Team.create({ name: 'A', AppId: app.id });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/teams/${team.id}`);

    expect(response).toMatchObject({
      status: 403,
      data: { message: 'User does not have sufficient permissions.' },
    });
  });

  it('should not delete teams from other organizations', async () => {
    const orgB = await Organization.create({ id: 'appsemble', name: 'Appsemble' });
    const appB = await App.create({
      definition: {
        name: 'Test App 2',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
          },
        },
      },
      path: 'test-app-2',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: orgB.id,
    });
    const team = await Team.create({ name: 'A', AppId: appB.id });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${appB.id}/teams/${team.id}`);
    expect(response).toMatchObject({
      status: 403,
      data: { message: 'User is not part of this organization.' },
    });
  });
});

describe('getTeamMembers', () => {
  it('should return an empty array', async () => {
    const team = await Team.create({ name: 'A', AppId: app.id });
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/teams/${team.id}/members`);

    expect(response).toMatchObject({ status: 200, data: [] });
  });

  it('should return a list of team members', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
    });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });

    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({ TeamId: team.id, UserId: user.id, role: TeamRole.Manager });
    await TeamMember.create({ TeamId: team.id, UserId: userB.id, role: TeamRole.Member });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/teams/${team.id}/members`);

    expect(response).toMatchObject({
      status: 200,
      data: [
        { id: user.id, name: user.name, primaryEmail: user.primaryEmail, role: TeamRole.Manager },
        { id: userB.id, name: userB.name, primaryEmail: userB.primaryEmail, role: TeamRole.Member },
      ],
    });
  });

  it('should not fetch members of non-existent teams', async () => {
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/teams/80000/members`);

    expect(response).toMatchObject({
      status: 404,
      data: { message: 'Team not found.' },
    });
  });
});

describe('addTeamMember', () => {
  it('should add an app member to a team', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
    });
    await AppMember.create({ AppId: app.id, UserId: userB.id, role: 'Member' });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
    const team = await Team.create({ name: 'A', AppId: app.id });
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/members`, {
      id: userB.id,
    });

    expect(response).toMatchObject({
      status: 201,
      data: {
        id: userB.id,
        name: userB.name,
        primaryEmail: userB.primaryEmail,
        role: TeamRole.Member,
      },
    });
  });

  it('should add an app member to a team by their primary email', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
    });
    await AppMember.create({ AppId: app.id, UserId: userB.id, role: 'Member' });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
    const team = await Team.create({ name: 'A', AppId: app.id });
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/members`, {
      id: userB.primaryEmail,
    });

    expect(response).toMatchObject({
      status: 201,
      data: {
        id: userB.id,
        name: userB.name,
        primaryEmail: userB.primaryEmail,
        role: TeamRole.Member,
      },
    });
  });

  it('should add an app member to a team if user has manager role', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
    });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
    await Member.update(
      { role: 'Member' },
      { where: { UserId: user.id, OrganizationId: organization.id } },
    );
    await AppMember.create({ AppId: app.id, UserId: userB.id, role: 'Member' });
    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({ UserId: user.id, TeamId: team.id, role: TeamRole.Manager });
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/members`, {
      id: userB.id,
    });

    expect(response).toMatchObject({
      status: 201,
      data: {
        id: userB.id,
        name: userB.name,
        primaryEmail: userB.primaryEmail,
        role: TeamRole.Member,
      },
    });
  });

  it('should not add an app member if user has insufficient permissions', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
    });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
    await Member.update(
      { role: 'Member' },
      { where: { UserId: user.id, OrganizationId: organization.id } },
    );
    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({ UserId: user.id, TeamId: team.id, role: TeamRole.Member });
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/members`, {
      id: userB.id,
    });

    expect(response).toMatchObject({
      status: 403,
      data: { message: 'User does not have sufficient permissions.' },
    });
  });

  it('should not add an app member to a team twice', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
    });
    await AppMember.create({ AppId: app.id, UserId: userB.id, role: 'Member' });
    const team = await Team.create({ name: 'A', AppId: app.id });
    authorizeStudio();
    await request.post(`/api/apps/${app.id}/teams/${team.id}/members`, { id: userB.id });
    const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/members`, {
      id: userB.id,
    });

    expect(response).toMatchObject({
      status: 400,
      data: {
        message: 'This user is already a member of this team.',
      },
    });
  });

  it("should not add a member who isn't part of the team's app members", async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
    });
    const team = await Team.create({ name: 'A', AppId: app.id });
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/members`, {
      id: userB.id,
    });

    expect(response).toMatchObject({
      status: 404,
      data: {
        message: `User with id ${userB.id} is not part of this app’s members.`,
      },
    });
  });
});

describe('removeTeamMember', () => {
  it('should remove a team member from a team', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
    });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({ UserId: userB.id, TeamId: team.id, role: TeamRole.Member });

    authorizeStudio();
    const response = await request.delete(
      `/api/apps/${app.id}/teams/${team.id}/members/${userB.id}`,
    );
    expect(response.status).toBe(204);
  });

  it('should remove a team member from a team by their primary email', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
    });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({ UserId: userB.id, TeamId: team.id, role: TeamRole.Member });

    authorizeStudio();
    const response = await request.delete(
      `/api/apps/${app.id}/teams/${team.id}/members/${userB.primaryEmail}`,
    );
    expect(response.status).toBe(204);
  });

  it('should remove a team member from a team if the user has the manager role', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
    });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
    await Member.update({ role: 'Member' }, { where: { UserId: user.id, OrganizationId: app.id } });
    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({ UserId: userB.id, TeamId: team.id, role: TeamRole.Member });
    await TeamMember.create({ UserId: user.id, TeamId: team.id, role: TeamRole.Manager });

    authorizeStudio();
    const response = await request.delete(
      `/api/apps/${app.id}/teams/${team.id}/members/${userB.id}`,
    );
    expect(response.status).toBe(204);
  });

  it('should not remove a team member from a team if the user has insufficient permissions', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
    });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
    await Member.update(
      { role: 'Member' },
      { where: { UserId: user.id, OrganizationId: organization.id } },
    );
    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({ UserId: userB.id, TeamId: team.id, role: TeamRole.Member });

    authorizeStudio();
    const response = await request.delete(
      `/api/apps/${app.id}/teams/${team.id}/members/${userB.id}`,
    );
    expect(response).toMatchObject({
      status: 403,
      data: { message: 'User does not have sufficient permissions.' },
    });
  });

  it('should not remove a member who isn’t part of the team', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
    });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
    const team = await Team.create({ name: 'A', AppId: app.id });

    authorizeStudio();
    const response = await request.delete(
      `/api/apps/${app.id}/teams/${team.id}/members/${userB.id}`,
    );

    expect(response).toMatchObject({
      status: 400,
      data: { message: 'This user is not a member of this team.' },
    });
  });
});

describe('updateTeamMember', () => {
  it('should update the role of a team member', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
    });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({ UserId: userB.id, TeamId: team.id, role: TeamRole.Member });

    authorizeStudio();
    const response = await request.put(`/api/apps/${app.id}/teams/${team.id}/members/${userB.id}`, {
      role: TeamRole.Manager,
    });

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: userB.id,
        name: userB.name,
        primaryEmail: userB.primaryEmail,
        role: TeamRole.Manager,
      },
    });
  });

  it('should update the role of a team member by their primary email', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
    });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({ UserId: userB.id, TeamId: team.id, role: TeamRole.Member });

    authorizeStudio();
    const response = await request.put(
      `/api/apps/${app.id}/teams/${team.id}/members/${userB.primaryEmail}`,
      {
        role: TeamRole.Manager,
      },
    );

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: userB.id,
        name: userB.name,
        primaryEmail: userB.primaryEmail,
        role: TeamRole.Manager,
      },
    });
  });

  it('should update the role of a team member if the user is a manager', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
    });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
    await Member.update(
      { role: 'Member' },
      { where: { UserId: user.id, OrganizationId: organization.id } },
    );
    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({ UserId: userB.id, TeamId: team.id, role: TeamRole.Member });
    await TeamMember.create({ UserId: user.id, TeamId: team.id, role: TeamRole.Manager });

    authorizeStudio();
    const response = await request.put(`/api/apps/${app.id}/teams/${team.id}/members/${userB.id}`, {
      role: TeamRole.Manager,
    });

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: userB.id,
        name: userB.name,
        primaryEmail: userB.primaryEmail,
        role: TeamRole.Manager,
      },
    });
  });

  it('should not update the role of a team member if the user has insufficient permissions', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
    });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
    await Member.update(
      { role: 'Member' },
      { where: { UserId: user.id, OrganizationId: organization.id } },
    );
    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({ UserId: userB.id, TeamId: team.id, role: TeamRole.Member });

    authorizeStudio();
    const response = await request.put(`/api/apps/${app.id}/teams/${team.id}/members/${userB.id}`, {
      role: TeamRole.Manager,
    });

    expect(response).toMatchObject({
      status: 403,
      data: {
        message: 'User does not have sufficient permissions.',
      },
    });
  });

  it('should not update the role of a non-existent team member', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
    });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
    const team = await Team.create({ name: 'A', AppId: app.id });

    authorizeStudio();
    const response = await request.put(`/api/apps/${app.id}/teams/${team.id}/members/${userB.id}`, {
      role: TeamRole.Manager,
    });

    expect(response).toMatchObject({
      status: 400,
      data: {
        message: 'This user is not a member of this team.',
      },
    });
  });
});
