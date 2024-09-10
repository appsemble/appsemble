import { randomBytes } from 'node:crypto';

import { assertKoaError, scimAssert } from '@appsemble/node-utils';
import { type Context } from 'koa';

import {
  App,
  AppMember,
  EmailAuthorization,
  Team,
  TeamMember,
  transactional,
  User,
} from '../../../../../models/index.js';
import { getCaseInsensitive } from '../../../../../utils/object.js';
import { convertAppMemberToScimUser } from '../../../../../utils/scim.js';

export async function createAppScimUser(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: { body },
  } = ctx;

  const externalId = getCaseInsensitive(body, 'externalid');
  scimAssert(typeof externalId === 'string', ctx, 400, 'Expected externalId to be string');

  const userName = getCaseInsensitive(body, 'username');
  scimAssert(typeof userName === 'string', ctx, 400, 'Expected userName to be string');

  const active = getCaseInsensitive(body, 'active');
  scimAssert(typeof active === 'boolean', ctx, 400, 'Expected active to be boolean');

  const name = getCaseInsensitive(body, 'name');
  scimAssert(name == null || typeof name === 'object', ctx, 400, 'Expected name to be an object');

  const formattedName = name && getCaseInsensitive(name, 'formatted');
  scimAssert(
    formattedName == null || typeof formattedName === 'string',
    ctx,
    400,
    'Expected name.formatted to be a string',
  );

  const locale = getCaseInsensitive(body, 'locale') || 'en';
  scimAssert(typeof locale === 'string', ctx, 400, 'Expected locale to be a string');

  const timezone = getCaseInsensitive(body, 'timezone') || 'Europe/Amsterdam';
  scimAssert(typeof timezone === 'string', ctx, 400, 'Expected locale to be a string');

  const enterpriseUser =
    getCaseInsensitive(body, 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:user') || {};
  scimAssert(
    enterpriseUser == null || typeof enterpriseUser === 'object',
    ctx,
    400,
    'Expected urn:ietf:params:scim:schemas:extension:enterprise:2.0:User to be an object',
  );

  const managerId = enterpriseUser && getCaseInsensitive(enterpriseUser, 'manager');
  scimAssert(
    managerId == null || typeof managerId === 'string',
    ctx,
    400,
    'Expected manager to be a string',
  );

  let member: AppMember;
  let team: Team;
  if (managerId) {
    team = await Team.findOne({ where: { AppId: appId, name: managerId } });
  }
  const managerTeam = await Team.findOne({ where: { AppId: appId, name: externalId } });
  const defaultRole = (await App.findByPk(appId, { attributes: ['definition'] }))?.definition
    .security?.default?.role;

  assertKoaError(
    !defaultRole,
    ctx,
    400,
    'App does not have a security definition in place to handle SCIM users. See SCIM documentation for more info.',
  );
  try {
    await transactional(async (transaction) => {
      const user = await User.create(
        {
          timezone,
          locale,
          name: formattedName,
          primaryEmail: userName,
        },
        { transaction },
      );

      const key = randomBytes(40).toString('hex');
      await EmailAuthorization.create({ UserId: user.id, email: userName, key }, { transaction });

      member = await AppMember.create(
        {
          UserId: user.id,
          AppId: appId,
          role: defaultRole,
          email: userName,
          name: formattedName,
          scimExternalId: externalId,
          scimActive: active,
          locale,
          emailVerified: true,
        },
        { transaction },
      );

      member.User = user;

      if (managerId) {
        if (!team) {
          team = await Team.create({ AppId: appId, name: managerId }, { transaction });
          const teamManager = await AppMember.findOne({
            where: { AppId: appId, scimExternalId: team.name },
          });

          if (teamManager) {
            await TeamMember.create(
              {
                TeamId: team.id,
                AppMemberId: teamManager.id,
                role: 'manager',
              },
              { transaction },
            );
          }
        }
        const teamMember = await TeamMember.create(
          {
            TeamId: team.id,
            AppMemberId: member.id,
            role: 'member',
          },
          { transaction },
        );
        teamMember.Team = team;
        member.TeamMembers = [teamMember];
      }

      if (managerTeam) {
        await TeamMember.create(
          {
            TeamId: managerTeam.id,
            AppMemberId: member.id,
            role: 'manager',
          },
          { transaction },
        );
      }
    });
  } catch {
    scimAssert(false, ctx, 409, 'Conflict');
  }

  ctx.body = convertAppMemberToScimUser(member);
}
