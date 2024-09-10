import { randomBytes } from 'node:crypto';

import {
  AppMemberPropertiesError,
  assertKoaError,
  logger,
  throwKoaError,
} from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, type AppMember } from '../../../../models/index.js';
import { getAppUrl } from '../../../../utils/app.js';
import { getAppMemberInfo } from '../../../../utils/appMember.js';

// TODO: CHECK
export async function patchAppMemberById(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId },
    request: {
      body: { email, locale, name, picture, properties },
    },
  } = ctx;
  const app = await App.findOne({
    where: { id: appId },
    // ...createAppMemberQuery(user as User, query),
  });

  assertKoaError(!app, ctx, 404, 'App account not found');

  const [member] = app.AppMembers;
  const result: Partial<AppMember> = {};
  if (email != null && member.email !== email) {
    result.email = email;
    result.emailVerified = false;
    result.emailKey = randomBytes(40).toString('hex');

    const verificationUrl = new URL('/Verify', getAppUrl(app));
    verificationUrl.searchParams.set('token', result.emailKey);

    mailer
      .sendTranslatedEmail({
        appId,
        to: { email, name },
        locale: member.locale,
        emailName: 'appMemberEmailChange',
        values: {
          link: (text) => `[${text}](${verificationUrl})`,
          name: member.name || 'null',
          appName: app.definition.name,
        },
        app,
      })
      .catch((error: Error) => {
        logger.error(error);
      });
  }

  if (name != null) {
    result.name = name;
  }

  if (picture) {
    result.picture = picture.contents;
  }

  if (properties) {
    const parsedUserProperties: Record<string, any> = {};
    for (const [propertyName, propertyValue] of Object.entries(properties)) {
      try {
        parsedUserProperties[propertyName] = JSON.parse(propertyValue as string);
      } catch {
        parsedUserProperties[propertyName] = propertyValue;
      }
    }
    result.properties = parsedUserProperties;
  }

  if (locale) {
    result.locale = locale;
  }

  try {
    await member.update(result);
  } catch (error) {
    if (error instanceof AppMemberPropertiesError) {
      throwKoaError(ctx, 400, error.message);
    }
  }
  ctx.body = getAppMemberInfo(member);
}
