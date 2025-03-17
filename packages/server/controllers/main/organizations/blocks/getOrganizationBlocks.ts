import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { literal, QueryTypes } from 'sequelize';

import { type BlockVersion, getDB, Organization } from '../../../../models/index.js';
import { createBlockVersionResponse } from '../../../../utils/createBlockVersionResponse.js';

export async function getOrganizationBlocks(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
  } = ctx;

  const organization = await Organization.findByPk(organizationId, {
    attributes: {
      include: ['updated', [literal('"Organization".icon IS NOT NULL'), 'hasIcon']],
      exclude: ['icon'],
    },
  });

  assertKoaCondition(!!organization, ctx, 404, 'Organization not found.');

  // Sequelize does not support sub queries
  // The alternative is to query everything and filter manually
  // See: https://github.com/sequelize/sequelize/issues/9509
  const blockVersions = await getDB().query<BlockVersion>(
    {
      query: `SELECT "OrganizationId", name, description, "longDescription", version, actions, events, layout, parameters, icon, visibility
        FROM "BlockVersion"
        WHERE "OrganizationId" = ?
        AND created IN (SELECT MAX(created)
                        FROM "BlockVersion"
                        GROUP BY "OrganizationId", name)`,
      values: [organizationId],
    },
    { type: QueryTypes.SELECT },
  );

  ctx.body = await createBlockVersionResponse(
    ctx,
    blockVersions,
    ({
      OrganizationId,
      actions,
      description,
      events,
      icon,
      layout,
      longDescription,
      name,
      parameters,
      version,
    }) => {
      let iconUrl = null;
      if (icon) {
        iconUrl = `/api/blocks/@${OrganizationId}/${name}/versions/${version}/icon`;
      } else if (organization.get('hasIcon')) {
        iconUrl = `/api/organizations/${OrganizationId}/icon?updated=${organization.updated.toISOString()}`;
      }
      return {
        name: `@${OrganizationId}/${name}`,
        description,
        longDescription,
        version,
        actions,
        events,
        iconUrl,
        layout,
        parameters,
      };
    },
  );
}
