import { TeamRole } from '@appsemble/utils/src';
import { request, setTestApp } from 'axios-test-instance';
import * as Koa from 'koa';

import { Member, Organization, Team, TeamMember, User } from '../models';
import { createServer } from '../utils/createServer';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';
import { testToken } from '../utils/test/testToken';

let authorization: string;
let organization: Organization;
let server: Koa;
let user: User;

beforeAll(createTestSchema('teams'));

beforeAll(async () => {
  server = await createServer({ argv: { host: 'http://localhost', secret: 'test' } });
  await setTestApp(server);
});

beforeEach(async () => {
  ({ authorization, user } = await testToken());
  organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });
});

afterEach(truncate);

afterAll(closeTestSchema);

describe('getTeams', () => {
  it('should return an empty array', async () => {
    const response = await request.get('/api/organizations/testorganization/teams', {
      headers: { authorization },
    });

    expect(response).toMatchObject({
      status: 200,
      data: [],
    });
  });

  it('should return a list of teams', async () => {
    const teamA = await Team.create({ name: 'A', OrganizationId: organization.id });
    const teamB = await Team.create({ name: 'B', OrganizationId: organization.id });

    const response = await request.get('/api/organizations/testorganization/teams', {
      headers: { authorization },
    });

    expect(response).toMatchObject({
      status: 200,
      data: [
        { id: teamA.id, name: teamA.name },
        { id: teamB.id, name: teamB.name },
      ],
    });
  });

  it('should include the role of the user', async () => {
    const teamA = await Team.create({ name: 'A', OrganizationId: organization.id });
    const teamB = await Team.create({ name: 'B', OrganizationId: organization.id });
    const teamC = await Team.create({ name: 'C', OrganizationId: organization.id });

    await TeamMember.bulkCreate([
      { role: TeamRole.Member, UserId: user.id, TeamId: teamA.id },
      { role: TeamRole.Manager, UserId: user.id, TeamId: teamB.id },
    ]);

    const response = await request.get('/api/organizations/testorganization/teams', {
      headers: { authorization },
    });

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
    const team = await Team.create({ name: 'A', OrganizationId: organization.id });
    await TeamMember.create({ role: TeamRole.Member, UserId: user.id, TeamId: team.id });

    const response = await request.get(`/api/organizations/testorganization/teams/${team.id}`, {
      headers: { authorization },
    });
    expect(response).toMatchObject({
      status: 200,
      data: { id: team.id, name: team.name, role: TeamRole.Member },
    });
  });

  it('should not return a team that doesn’t exist', async () => {
    const response = await request.get('/api/organizations/testorganization/teams/80000', {
      headers: { authorization },
    });

    expect(response).toMatchObject({
      status: 404,
      data: { message: 'Team not found.' },
    });
  });

  it('should not return a team for another organization', async () => {
    const team = await Team.create({ name: 'A', OrganizationId: organization.id });
    await Organization.create({
      id: 'appsemble',
      name: 'Appsemble',
    });

    const response = await request.get(`/api/organizations/appsemble/teams/${team.id}`, {
      headers: { authorization },
    });

    expect(response).toMatchObject({
      status: 404,
      data: { message: 'Team not found.' },
    });
  });
});

describe('createTeam', () => {
  it('should create a team if user is Owner', async () => {
    const response = await request.post(
      '/api/organizations/testorganization/teams',
      { name: 'Test Team' },
      { headers: { authorization } },
    );

    expect(response).toMatchObject({
      status: 201,
      data: { id: expect.any(Number), name: 'Test Team', role: TeamRole.Manager },
    });
  });

  it('should not create a team if user is not an Owner', async () => {
    await Member.update(
      { role: 'Maintainer' },
      { where: { UserId: user.id, OrganizationId: organization.id } },
    );
    const response = await request.post(
      '/api/organizations/testorganization/teams',
      { name: 'Test Team' },
      { headers: { authorization } },
    );

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
    const response = await request.post(
      '/api/organizations/appsemble/teams',
      { name: 'Test Team' },
      { headers: { authorization } },
    );

    expect(response).toMatchObject({
      status: 403,
      data: { message: 'User is not part of this organization.' },
    });
  });

  it('should not create a team for non-existent organizations', async () => {
    const response = await request.post(
      '/api/organizations/appsemble/teams',
      { name: 'Test Team' },
      { headers: { authorization } },
    );

    expect(response).toMatchObject({
      status: 404,
      data: { message: 'Organization not found.' },
    });
  });
});

describe('updateTeam', () => {
  it('should update the name of the team', async () => {
    const team = await Team.create({ name: 'A', OrganizationId: organization.id });
    const response = await request.put(
      `/api/organizations/testorganization/teams/${team.id}`,
      { name: 'B' },
      { headers: { authorization } },
    );
    const responseB = await request.get(`/api/organizations/testorganization/teams/${team.id}`, {
      headers: { authorization },
    });

    expect(response).toMatchObject({ status: 200, data: { id: team.id, name: 'B' } });
    expect(responseB.data.name).toStrictEqual('B');
  });
});

describe('deleteTeam', () => {
  it('should delete a team', async () => {
    const team = await Team.create({ name: 'A', OrganizationId: organization.id });
    const response = await request.delete(`/api/organizations/testorganization/teams/${team.id}`, {
      headers: { authorization },
    });
    const responseB = await request.get('/api/organizations/testorganization/teams', {
      headers: { authorization },
    });

    expect(response.status).toStrictEqual(204);
    expect(responseB.data).toStrictEqual([]);
  });
});
