import { scimAssert, throwKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import {
  App,
  AppMember,
  Team,
  TeamMember,
  transactional,
  User,
} from '../../../../../models/index.js';
import { getCaseInsensitive } from '../../../../../utils/object.js';
import { convertAppMemberToScimUser } from '../../../../../utils/scim.js';

export async function patchAppScimUser(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, userId },
    request: { body },
  } = ctx;

  const member = await AppMember.findOne({
    where: { AppId: appId, id: userId },
    include: [
      {
        model: User,
      },
      {
        model: TeamMember,
        where: { role: 'member' },
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

  const operations = getCaseInsensitive(body, 'operations');
  scimAssert(Array.isArray(operations), ctx, 400, 'Expected operations to be array');

  let managerId: string | undefined;

  function replace(path: string, value: unknown): void {
    const lower = path.toLowerCase();
    scimAssert(typeof value === 'string', ctx, 400, 'Expected value to be a string');

    if (lower === 'externalid') {
      member.scimExternalId = value;
    } else if (lower === 'locale') {
      member.User.locale = value;
    } else if (lower === 'name.formatted') {
      member.name = value;
      member.User.name = value;
    } else if (lower === 'timezone') {
      member.User.timezone = value;
    } else if (lower === 'username') {
      member.email = value;
      member.User.primaryEmail = value;
    } else if (lower === 'active') {
      member.scimActive = value.toLowerCase() === 'true';
    } else if (lower === 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:user:manager') {
      if (!value || typeof value === 'string') {
        managerId = value;
      } else if (typeof value === 'object') {
        managerId = getCaseInsensitive(value, 'value') as string;
      }
    } else {
      throwKoaError(ctx, 400, `Unknown path: ${path}`);
    }
  }

  for (const operation of operations) {
    scimAssert(
      typeof operation === 'object' && operation != null,
      ctx,
      400,
      'Expected operation to be an object',
    );

    let op = getCaseInsensitive(operation, 'op');
    scimAssert(typeof op === 'string', ctx, 400, 'Only add and replace operations are supported');
    op = op.toLowerCase();
    scimAssert(
      op === 'add' || op === 'replace',
      ctx,
      400,
      'Only add and replace operations are supported',
    );

    const value = getCaseInsensitive(operation, 'value');
    if (typeof value === 'string') {
      const path = getCaseInsensitive(operation, 'path');
      scimAssert(typeof path === 'string', ctx, 400, 'Expected path to be string');

      replace(path, value);
    } else if (typeof value === 'object' && value != null) {
      for (const [key, val] of Object.entries(value)) {
        if (typeof val === 'string') {
          replace(key, val);
        } else if (typeof val === 'boolean') {
          replace(key, String(val));
        }
      }
    } else {
      throwKoaError(ctx, 400, 'Expected value to be string or object');
    }
  }

  await transactional(async (transaction) => {
    const promises: Promise<unknown>[] = [
      member.save({ transaction }),
      member.User.save({ transaction }),
    ];
    if (managerId != null && managerId !== '') {
      let team = await Team.findOne({
        where: { AppId: appId, name: managerId },
        include: [
          { model: TeamMember, required: false },
          { model: App, include: [{ model: AppMember, required: false }] },
        ],
      });

      if (!team) {
        team = await Team.create({ AppId: appId, name: managerId }, { transaction });
        team.App = await App.findByPk(appId, { include: [{ model: AppMember }] });
      }

      if (!team.Members?.some((m) => m.AppMemberId === member.id)) {
        promises.push(
          TeamMember.create(
            {
              TeamId: team.id,
              AppMemberId: member.id,
              role: 'member',
            },
            { transaction },
          ),
        );
      }

      // Check if manager has an AppMember account, but isn't assigned to the team yet
      if (
        team.App?.AppMembers?.some((m) => m.id === managerId) &&
        !team.Members?.some((m) => m.AppMemberId === managerId)
      ) {
        promises.push(
          TeamMember.create(
            {
              TeamId: team.id,
              AppMemberId: managerId,
              role: 'manager',
            },
            { transaction },
          ),
        );
      }

      promises.push(team.save({ transaction }));
    }
    return Promise.all(promises);
  });

  ctx.body = convertAppMemberToScimUser(member);
}
