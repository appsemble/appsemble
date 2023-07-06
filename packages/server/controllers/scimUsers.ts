import { scimAssert, SCIMError } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { col, fn, where, type WhereOptions } from 'sequelize';

import { AppMember, Team, TeamMember, transactional, User } from '../models/index.js';
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
    'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User': member.User.TeamMembers?.length
      ? { manager: { value: member.User.TeamMembers[0].Team.name } }
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
  scimAssert(typeof externalId === 'string', 400, 'Expected externalId to be string');

  const userName = getCaseInsensitive(body, 'username');
  scimAssert(typeof userName === 'string', 400, 'Expected userName to be string');

  const active = getCaseInsensitive(body, 'active');
  scimAssert(typeof active === 'boolean', 400, 'Expected active to be boolean');

  const name = getCaseInsensitive(body, 'name');
  scimAssert(name == null || typeof name === 'object', 400, 'Expected name to be an object');

  const formattedName = name && getCaseInsensitive(name, 'formatted');
  scimAssert(
    formattedName == null || typeof formattedName === 'string',
    400,
    'Expected name.formatted to be a string',
  );

  const locale = getCaseInsensitive(body, 'locale') || 'en';
  scimAssert(typeof locale === 'string', 400, 'Expected locale to be a string');

  const timezone = getCaseInsensitive(body, 'timezone') || 'Europe/Amsterdam';
  scimAssert(typeof timezone === 'string', 400, 'Expected locale to be a string');

  const enterpriseUser =
    getCaseInsensitive(body, 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:user') || {};
  scimAssert(
    enterpriseUser == null || typeof enterpriseUser === 'object',
    400,
    'Expected urn:ietf:params:scim:schemas:extension:enterprise:2.0:User to be an object',
  );

  const managerId = enterpriseUser && getCaseInsensitive(enterpriseUser, 'manager');
  scimAssert(
    managerId == null || typeof managerId === 'string',
    400,
    'Expected manager to be a string',
  );

  let member: AppMember;
  let team: Team;
  if (managerId) {
    team = await Team.findOne({ where: { AppId: appId, name: managerId } });
  }
  const managerTeam = await Team.findOne({ where: { AppId: appId, name: externalId } });
  try {
    await transactional(async (transaction) => {
      const user = await User.create(
        {
          timezone,
          locale,
          name: formattedName,
        },
        { transaction },
      );

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
                UserId: teamManager.UserId,
                role: 'manager',
              },
              { transaction },
            );
          }
        }
        const teamMember = await TeamMember.create(
          {
            TeamId: team.id,
            UserId: user.id,
            role: 'member',
          },
          { transaction },
        );
        teamMember.Team = team;
        user.TeamMembers = [teamMember];
      }

      if (managerTeam) {
        await TeamMember.create(
          {
            TeamId: managerTeam.id,
            UserId: user.id,
            role: 'manager',
          },
          { transaction },
        );
      }

      member = await AppMember.create(
        {
          UserId: user.id,
          AppId: appId,
          role: 'User',
          email: userName,
          name: formattedName,
          scimExternalId: externalId,
        },
        { transaction },
      );

      member.User = user;
    });
  } catch {
    throw new SCIMError(409, 'Conflict');
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
        include: [
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
      },
    ],
  });
  scimAssert(member, 404, 'User not found');

  ctx.body = toScimUser(member);
}

export async function deleteSCIMUser(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, userId },
  } = ctx;

  const deletedRows = await AppMember.destroy({ where: { id: userId, AppId: appId } });
  scimAssert(deletedRows, 404, 'User not found');
}

export async function getSCIMUsers(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    queryParams: { count = 50, filter, startIndex = 1 },
  } = ctx;

  interface QueryFilter {
    target: string;
    operator: string;
    value: string;
  }

  const include = [
    {
      model: User,
      include: [
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
    },
  ];

  async function getUserResources(queryFilter: string): Promise<{
    count: number;
    rows: AppMember[];
  }> {
    const filterData: QueryFilter = {
      target: (queryFilter.split(' ')[0] || '').toLowerCase(),
      operator: (queryFilter.split(' ')[1] || '').toLowerCase(),
      value: (queryFilter.split('"')[1] || '').toLowerCase(),
    };
    const whereClause: WhereOptions<any> = {};

    if (filterData.operator !== 'eq') {
      return { count: 0, rows: [] };
    }

    if (filterData.target === 'username') {
      whereClause.email = where(fn('LOWER', col('email')), filterData.value);
    }
    if (filterData.target === 'externalid') {
      whereClause.scimExternalId = filterData.value;
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

  const members = filter
    ? await getUserResources(filter)
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

  console.log(ctx.body)
}

export async function updateSCIMUser(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, userId },
    request: { body },
  } = ctx;

  const externalId = getCaseInsensitive(body, 'externalid');
  scimAssert(typeof externalId === 'string', 400, 'Expected externalId to be string');

  const userName = getCaseInsensitive(body, 'username');
  scimAssert(typeof userName === 'string', 400, 'Expected userName to be string');

  const active = getCaseInsensitive(body, 'active');
  scimAssert(typeof active === 'boolean', 400, 'Expected active to be boolean');

  const name = getCaseInsensitive(body, 'name');
  scimAssert(name == null || typeof name === 'object', 400, 'Expected name to be an object');

  const formattedName = name && getCaseInsensitive(name, 'formatted');
  scimAssert(
    formattedName == null || typeof formattedName === 'string',
    400,
    'Expected name.formatted to be a string',
  );

  const locale = getCaseInsensitive(body, 'locale') || 'en';
  scimAssert(typeof locale === 'string', 400, 'Expected locale to be a string');

  const timezone = getCaseInsensitive(body, 'timezone') || 'Europe/Amsterdam';
  scimAssert(typeof timezone === 'string', 400, 'Expected locale to be a string');

  const enterpriseUser =
    getCaseInsensitive(body, 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:user') || {};
  scimAssert(
    enterpriseUser == null || typeof enterpriseUser === 'object',
    400,
    'Expected urn:ietf:params:scim:schemas:extension:enterprise:2.0:User to be an object',
  );

  const managerId = enterpriseUser && getCaseInsensitive(enterpriseUser, 'manager');
  scimAssert(
    managerId == null || typeof managerId === 'string',
    400,
    'Expected manager to be a string',
  );

  const member = await AppMember.findOne({
    where: { AppId: appId, id: userId },
    include: [
      {
        model: User,
        include: [
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
      },
    ],
  });
  scimAssert(member, 404, 'User not found');

  await transactional(async (transaction) => {
    const promises: Promise<unknown>[] = [
      member.update(
        { email: userName, name: formattedName, scimExternalId: externalId },
        { transaction },
      ),
      member.User.update({ timezone, locale, name: formattedName }, { transaction }),
    ];
    if (managerId != null) {
      const team = await Team.findOne({ where: { AppId: appId, name: managerId } });
      if (managerId === '') {
        if (team) {
          promises.push(
            TeamMember.destroy({ where: { TeamId: team.id, UserId: member.User.id }, transaction }),
          );
        }
      } else {
        if (team) {
          if (!(await TeamMember.findOne({ where: { TeamId: team.id, UserId: member.User.id } }))) {
            promises.push(
              TeamMember.create({ TeamId: team.id, UserId: member.User.id }, { transaction }),
            );
          }
        } else {
          promises.push(
            Team.create({ AppId: appId, name: managerId }, { transaction }).then((t) =>
              TeamMember.create({ TeamId: t.id, UserId: member.User.id }, { transaction }),
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
        include: [
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
      },
    ],
  });
  scimAssert(member, 404, 'User not found');

  const operations = getCaseInsensitive(body, 'operations');
  scimAssert(Array.isArray(operations), 400, 'Expected operations to be array');

  let managerId: string | undefined;

  function replace(path: string, value: unknown): void {
    const lower = path.toLowerCase();
    scimAssert(typeof value === 'string', 400, 'Expected value to be a string');

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
    } else if (lower === 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:user:manager') {
      if (!value || typeof value === 'string') {
        managerId = value;
      } else if (typeof value === 'object') {
        managerId = getCaseInsensitive(value, 'value') as string;
      }
    } else {
      ctx.throw(`Unknown path: ${path}`, 400);
    }
  }

  for (const operation of operations) {
    scimAssert(
      typeof operation === 'object' && operation != null,
      400,
      'Expected operation to be an object',
    );

    let op = getCaseInsensitive(operation, 'op');
    scimAssert(typeof op === 'string', 400, 'Only add and replace operations are supported');
    op = op.toLowerCase();
    scimAssert(
      op === 'add' || op === 'replace',
      400,
      'Only add and replace operations are supported',
    );

    const value = getCaseInsensitive(operation, 'value');
    if (typeof value === 'string') {
      const path = getCaseInsensitive(operation, 'path');
      scimAssert(typeof path === 'string', 400, 'Expected path to be string');

      replace(path, value);
    } else if (typeof value === 'object' && value != null) {
      for (const [key, val] of Object.entries(value)) {
        replace(key, val);
      }
    } else {
      ctx.throw('Expected value to be string or object', 400);
    }
  }

  await transactional(async (transaction) => {
    const promises: Promise<unknown>[] = [
      member.save({ transaction }),
      member.User.save({ transaction }),
    ];
    if (managerId != null) {
      let teamManager: string;
      try {
        teamManager = member.User.TeamMembers[0].Team.getDataValue('name');
      } catch {
        // Do nothing
      }

      const team = await Team.findOne({ where: { AppId: appId, name: teamManager || managerId } });
      if (managerId === '') {
        if (team) {
          promises.push(
            TeamMember.destroy({ where: { TeamId: team.id, UserId: member.User.id }, transaction }),
          );
        }
      } else {
        if (team) {
          if (await TeamMember.findOne({ where: { TeamId: team.id, UserId: member.User.id } })) {
            promises.push(team.update({ name: managerId }, { transaction }));
          } else {
            promises.push(
              TeamMember.create({ TeamId: team.id, UserId: member.User.id }, { transaction }),
            );
          }
        } else {
          promises.push(
            Team.create({ AppId: appId, name: managerId }, { transaction }).then((t) =>
              TeamMember.create({ TeamId: t.id, UserId: member.User.id }, { transaction }),
            ),
          );
        }
      }
    }
    return Promise.all(promises);
  });

  ctx.body = toScimUser(member);
}
