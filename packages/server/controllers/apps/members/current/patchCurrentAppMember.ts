import {
  AppMemberPropertiesError,
  assertKoaCondition,
  throwKoaError,
  uploadToBuffer,
} from '@appsemble/node-utils';
import { type Context } from 'koa';
import { parsePhoneNumber } from 'libphonenumber-js/min';

import { App, type AppMember, getAppDB } from '../../../../models/index.js';
import { getAppMemberInfoById, parseAppMemberProperties } from '../../../../utils/appMember.js';

export async function patchCurrentAppMember(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { locale, name, phoneNumber, picture, properties },
    },
    user: authSubject,
  } = ctx;
  const app = await App.findOne({
    attributes: ['id', 'definition'],
    where: { id: appId },
  });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const { AppMember } = await getAppDB(appId);
  const appMember = await AppMember.findByPk(authSubject!.id);

  assertKoaCondition(appMember != null, ctx, 404, 'App member not found');

  if (phoneNumber) {
    const enabled = app.definition?.members?.phoneNumber?.enable === true;
    assertKoaCondition(enabled, ctx, 400, 'App does not allow registering phone numbers');
    const phoneNumberExists = await AppMember.count({
      where: {
        phoneNumber: parsePhoneNumber(phoneNumber, 'NL').format('INTERNATIONAL'),
      },
    });
    assertKoaCondition(
      !phoneNumberExists,
      ctx,
      409,
      'App member with this phone number already exists.',
    );
  }

  const result: Partial<AppMember> = {};

  if (name != null) {
    result.name = name;
  }

  if (phoneNumber != null) {
    result.phoneNumber = phoneNumber;
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

  ctx.body = await getAppMemberInfoById(appId, authSubject!.id);
}
