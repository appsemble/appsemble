import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { AppCollection, Organization } from '../../../../models/index.js';
import { checkUserPermissions } from '../../../../utils/authorization.js';

export async function createOrganizationAppCollection(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
    request: { body },
  } = ctx;

  await checkUserPermissions(ctx, organizationId, [MainPermission.CreateAppCollections]);

  const collection = await AppCollection.create({
    name: body.name,
    expertName: body.expertName,
    expertDescription: body.expertDescription,
    expertProfileImage: body.expertProfileImage.contents,
    expertProfileImageMimeType: body.expertProfileImage.mime,
    headerImage: body.headerImage.contents,
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
