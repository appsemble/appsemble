import { type Context } from 'koa';
import { QueryTypes } from 'sequelize';

import { type BlockVersion, getDB } from '../../../models/index.js';
import { createBlockVersionResponse } from '../../../utils/createBlockVersionResponse.js';

export async function queryBlocks(ctx: Context): Promise<void> {
  // Sequelize does not support subqueries
  // The alternative is to query everything and filter manually
  // See: https://github.com/sequelize/sequelize/issues/9509
  const blockVersions = await getDB().query<
    BlockVersion & { hasIcon: boolean; hasOrganizationIcon: boolean; organizationUpdated: Date }
  >(
    `SELECT
      bv.actions,
      bv.description,
      bv.events,
      bv.examples,
      bv.icon IS NOT NULL as "hasIcon",
      bv.layout,
      bv."longDescription",
      bv.name,
      bv."OrganizationId",
      bv.parameters,
      bv.version,
      bv.visibility,
      bv."wildcardActions",
      o.icon IS NOT NULL as "hasOrganizationIcon",
      o.updated AS "organizationUpdated"
    FROM "BlockVersion" bv
    INNER JOIN "Organization" o ON o.id = bv."OrganizationId"
    WHERE bv.created IN (
      SELECT MAX(created)
      FROM "BlockVersion"
      GROUP BY "OrganizationId", name
    )`,
    { type: QueryTypes.SELECT },
  );

  ctx.body = await createBlockVersionResponse(ctx, blockVersions, (blockVersion) => {
    const {
      OrganizationId,
      actions,
      description,
      events,
      examples,
      hasIcon,
      hasOrganizationIcon,
      layout,
      longDescription,
      name,
      organizationUpdated,
      parameters,
      version,
      wildcardActions,
    } = blockVersion;
    let iconUrl = null;
    if (hasIcon) {
      iconUrl = `/api/blocks/@${OrganizationId}/${name}/versions/${version}/icon`;
    } else if (hasOrganizationIcon) {
      // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
      iconUrl = `/api/organizations/${OrganizationId}/icon?updated=${organizationUpdated.toISOString()}`;
    }
    return {
      name: `@${OrganizationId}/${name}`,
      description,
      longDescription,
      version,
      actions,
      events,
      examples,
      iconUrl,
      layout,
      parameters,
      wildcardActions,
    };
  });
}
