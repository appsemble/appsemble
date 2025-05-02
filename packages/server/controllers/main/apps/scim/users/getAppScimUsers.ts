import { type Context } from 'koa';
import { type Compare, parse } from 'scim2-parse-filter';
import { col, fn, where, type WhereOptions } from 'sequelize';

import { type AppMember, getAppDB } from '../../../../../models/index.js';
import { convertAppMemberToScimUser } from '../../../../../utils/scim.js';

export async function getAppScimUsers(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    queryParams: { count = 50, filter, startIndex = 1 },
  } = ctx;
  const { AppMember, Group, GroupMember } = await getAppDB(appId);
  const parsedFilter = filter ? (parse(filter) as Compare) : undefined;
  const include = [
    {
      model: GroupMember,
      include: [
        {
          model: Group,
          required: false,
        },
      ],
    },
  ];

  async function getUserResources(queryFilter: Compare): Promise<{
    count: number;
    rows: AppMember[];
  }> {
    const whereClause: WhereOptions<any> = {};
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
        include,
      });

  ctx.body = {
    schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
    totalResults: members.count,
    startIndex,
    itemsPerPage: members.rows.length,
    Resources: members.rows.map((member) => convertAppMemberToScimUser(appId, member)),
  };
}
