import { type BlockManifest } from '@appsemble/types';
import { type Context } from 'koa';

import { type BlockVersion, Organization, type User } from '../models/index.js';

interface ExtendedBlockVersion extends BlockVersion {
  hasIcon?: boolean;
  hasOrganizationIcon?: boolean;
  organizationUpdated?: Date;
}

export async function createBlockVersionResponse(
  ctx: Context,
  blockVersions: ExtendedBlockVersion[],
  mapper: (blockVersion: ExtendedBlockVersion) => Omit<BlockManifest, 'files' | 'languages'>,
): Promise<Omit<BlockManifest, 'files' | 'languages'>[]> {
  const { user } = ctx;

  try {
    await (user as User)?.reload({
      include: [
        {
          model: Organization,
          attributes: {
            include: ['id'],
          },
        },
      ],
    });
  } catch {
    /* Should still continue to fetch public blocks */
  }

  const organizationIds = new Set(
    (user as User)?.Organizations?.map((org: Organization) => org.id) || undefined,
  );

  return blockVersions
    .filter(
      (blockVersion) =>
        blockVersion.visibility === 'public' || organizationIds.has(blockVersion.OrganizationId),
    )
    .map(mapper);
}
