import {
  AppMemberPropertiesError,
  assertKoaCondition,
  throwKoaError,
  uploadToBuffer,
} from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppMember } from '../../../../models/index.js';
import { getAppMemberInfoById, parseAppMemberProperties } from '../../../../utils/appMember.js';

export async function patchCurrentAppMember(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { locale, name, picture, properties },
    },
    user: authSubject,
  } = ctx;

  const app = await App.findOne({
    where: { id: appId },
  });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const appMember = await AppMember.findByPk(authSubject!.id);

  assertKoaCondition(appMember != null, ctx, 404, 'App member not found');

  const result: Partial<AppMember> = {};

  if (name != null) {
    result.name = name;
  }

  if (picture === '') {
    result.picture = null;
  } else if (picture) {
    result.picture = await uploadToBuffer(picture.path);
  }

  if (properties) {
    result.properties = { ...appMember.properties, ...parseAppMemberProperties(properties) };
  }

  if (locale) {
    result.locale = locale;
  }

  try {
    await appMember.update(result);
  } catch (error) {
    if (error instanceof AppMemberPropertiesError) {
      throwKoaError(ctx, 400, error.message);
    }
  }

  ctx.body = await getAppMemberInfoById(authSubject!.id);
}
