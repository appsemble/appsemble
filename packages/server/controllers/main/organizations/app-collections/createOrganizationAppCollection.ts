import { uploadToBuffer } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { AppCollection, Organization } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function createOrganizationAppCollection(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
    request: { body },
  } = ctx;

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId,
    requiredPermissions: [OrganizationPermission.CreateAppCollections],
  });

  const collection = await AppCollection.create({
    name: body.name,
    expertName: body.expertName,
    expertDescription: body.expertDescription,
    expertProfileImage: body.expertProfileImage.path
      ? await uploadToBuffer(body.expertProfileImage.path)
      : undefined,
    expertProfileImageMimeType: body.expertProfileImage.mime,
    headerImage: body.headerImage.path ? await uploadToBuffer(body.headerImage.path) : undefined,
    headerImageMimeType: body.headerImage.mime,
    OrganizationId: organizationId,
    visibility: body.visibility ?? 'public',
    domain: body.domain,
  });

  await collection.reload({
    include: [
      {
        model: Organization,
        attributes: ['name'],
      },
    ],
  });

  ctx.response.status = 201;
  ctx.response.body = collection.toJSON();
}
