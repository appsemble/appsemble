import { randomBytes } from 'node:crypto';

import { scimAssert } from '@appsemble/node-utils';
import { type Context } from 'koa';

import {
  AppMember,
  EmailAuthorization,
  Team,
  TeamMember,
  transactional,
  User,
} from '../../../../../models/index.js';
import { getCaseInsensitive } from '../../../../../utils/object.js';
import { convertAppMemberToScimUser } from '../../../../../utils/scim.js';

export async function updateAppScimUser(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, userId },
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

  const member = await AppMember.findOne({
    where: { AppId: appId, id: userId },
    include: [
      {
        model: User,
      },
      {
        model: TeamMember,
        required: false,
        include: [
          {
            model: Team,
            where: { AppId: appId },
          },
        ],
      },
    ],
  });
  scimAssert(member, ctx, 404, 'User not found');

  await transactional(async (transaction) => {
    const key = randomBytes(40).toString('hex');
    const promises: Promise<unknown>[] = [
      member.update(
        { email: userName, name: formattedName, scimExternalId: externalId, scimActive: active },
        { transaction },
      ),
      member.User.update(
        { timezone, locale, name: formattedName, primaryEmail: userName },
        { transaction },
      ),

      EmailAuthorization.create({ UserId: member.UserId, email: userName, key }, { transaction }),
    ];
    if (managerId != null) {
      const team = await Team.findOne({ where: { AppId: appId, name: managerId } });
      if (managerId === '') {
        if (team) {
          promises.push(
            TeamMember.destroy({ where: { TeamId: team.id, AppMemberId: member.id }, transaction }),
          );
        }
      } else {
        if (team) {
          if (!(await TeamMember.findOne({ where: { TeamId: team.id, AppMemberId: member.id } }))) {
            promises.push(
              TeamMember.create({ TeamId: team.id, AppMemberId: member.id }, { transaction }),
            );
          }
        } else {
          promises.push(
            Team.create({ AppId: appId, name: managerId }, { transaction }).then((t) =>
              TeamMember.create({ TeamId: t.id, AppMemberId: member.id }, { transaction }),
            ),
          );
        }
      }
    }
    return Promise.all(promises);
  });

  ctx.body = convertAppMemberToScimUser(member);
}
