import { BlockManifest } from '@appsemble/types';
import { Context } from 'koa';

import { BlockVersion, Organization } from '../models';

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

  if (user) {
    await user.reload({
      include: [
        {
          model: Organization,
          attributes: {
            include: ['id'],
          },
        },
      ],
    });
  }

  const organizationIds = new Set(user?.Organizations?.map((org) => org.id) || undefined);

  return blockVersions
    .filter(
      (blockVersion) =>
        blockVersion.visibility === 'public' || organizationIds.has(blockVersion.OrganizationId),
    )
    .map(mapper);
}
