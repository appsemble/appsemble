import { randomBytes } from 'node:crypto';

import { assertKoaError, scimAssert, throwKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { type Compare, parse } from 'scim2-parse-filter';
import { col, fn, where, type WhereOptions } from 'sequelize';

import {
  App,
  AppMember,
  EmailAuthorization,
  Team,
  TeamMember,
  transactional,
  User,
} from '../models/index.js';
import { type ScimUser } from '../types/scim.js';
import { getCaseInsensitive } from '../utils/object.js';
import { getScimLocation } from '../utils/scim.js';

function toScimUser(member: AppMember): ScimUser {
  return {
    schemas: [
      'urn:ietf:params:scim:schemas:core:2.0:User',
      'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
    ],
    userName: member.email ?? undefined,
    active: member.scimActive,
    id: member.id,
    externalId: member.scimExternalId,
    name: member.name
      ? {
          formatted: member.name,
        }
      : undefined,
    timezone: member.User.timezone,
    locale: member.locale || member.User.locale,
    'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User': member.TeamMembers?.length
      ? {
          manager: { value: member.TeamMembers.at(-1).Team.name },
        }
      : undefined,
    meta: {
      created: member.created.toISOString(),
      lastModified: member.updated.toISOString(),
      location: getScimLocation(member.AppId, `Users/${member.id}`),
      resourceType: 'User',
    },
  };
}

export async function createSCIMUser(ctx: Context): Promise<void> {
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

  ctx.body = toScimUser(member);
}

export async function getSCIMUser(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, userId },
  } = ctx;

  const member = await AppMember.findOne({
    where: { AppId: appId, id: userId },
    include: [
      {
        model: User,
      },
      {
        model: TeamMember,
        include: [
          {
            model: Team,
            required: false,
          },
        ],
      },
    ],
  });
  scimAssert(member, ctx, 404, 'User not found');

  ctx.body = toScimUser(member);
}

export async function deleteSCIMUser(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, userId },
  } = ctx;

  const deletedRows = await AppMember.destroy({ where: { id: userId, AppId: appId } });
  scimAssert(deletedRows, ctx, 404, 'User not found');
}

export async function getSCIMUsers(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    queryParams: { count = 50, filter, startIndex = 1 },
  } = ctx;

  const parsedFilter = filter ? (parse(filter) as Compare) : undefined;
  const include = [
    {
      model: User,
    },
    {
      model: TeamMember,
      include: [
        {
          model: Team,
          required: false,
        },
      ],
    },
  ];

  async function getUserResources(queryFilter: Compare): Promise<{
    count: number;
    rows: AppMember[];
  }> {
    const whereClause: WhereOptions<any> = { AppId: appId };
    const attribute = queryFilter.attrPath.toLowerCase();
    const value =
      typeof queryFilter.compValue === 'string'
        ? queryFilter.compValue.toLowerCase()
        : queryFilter.compValue;

    if (queryFilter.op !== 'eq') {
      return { count: 0, rows: [] };
    }

    if (attribute === 'username') {
      whereClause.email = where(fn('LOWER', col('email')), value);
    }
    if (attribute === 'externalid') {
      whereClause.scimExternalId = value;
    }

    if (Object.keys(whereClause).length > 0) {
      whereClause.AppId = appId;

      const members = await AppMember.findAndCountAll({
        limit: count,
        offset: startIndex - 1,
        where: whereClause,
        include,
      });
      return members;
    }

    return { count: 0, rows: [] };
  }

  const members = parsedFilter
    ? await getUserResources(parsedFilter)
    : await AppMember.findAndCountAll({
        limit: count,
        offset: startIndex - 1,
        where: { AppId: appId },
        include,
      });

  ctx.body = {
    schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
    totalResults: members.count,
    startIndex,
    itemsPerPage: members.rows.length,
    Resources: members.rows.map(toScimUser),
  };
}

export async function updateSCIMUser(ctx: Context): Promise<void> {
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

  ctx.body = toScimUser(member);
}

export async function patchSCIMUser(ctx: Context): Promise<void> {
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

  ctx.body = toScimUser(member);
}
