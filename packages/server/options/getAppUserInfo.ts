import { type GetAppUserInfoParams } from '@appsemble/node-utils';
import { type UserInfo } from '@appsemble/types';
import { forbidden } from '@hapi/boom';
import { literal, Op } from 'sequelize';

import { AppMember, EmailAuthorization, User } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { getGravatarUrl } from '../utils/gravatar.js';

export async function getAppUserInfo({ client, user }: GetAppUserInfoParams): Promise<UserInfo> {
  if (client && 'app' in client) {
    const appMember = await AppMember.findOne({
      attributes: [
        [literal('"AppMember"."picture" IS NOT NULL'), 'hasPicture'],
        'email',
        'emailVerified',
        'name',
        'updated',
      ],
      where: { UserId: user.id, AppId: client.app.id },
      include: [User],
    });

    if (!appMember) {
      // The authenticated user may have been deleted.
      throw forbidden();
    }

    return {
      email: appMember.email,
      email_verified: appMember.emailVerified,
      name: appMember.name,
      picture: appMember.hasPicture
        ? String(
            new URL(
              `/api/apps/${client.app.id}/members/${
                user.id
              }/picture?updated=${appMember.updated.getTime()}`,
              argv.host,
            ),
          )
        : getGravatarUrl(appMember.email),
      sub: user.id,
      locale: appMember.User.locale,
      zoneinfo: appMember.User.timezone,
    };
  }
  await (user as User).reload({
    attributes: ['primaryEmail', 'name', 'locale', 'timezone'],
    include: [
      {
        required: false,
        model: EmailAuthorization,
        attributes: ['verified'],
        where: {
          email: { [Op.col]: 'User.primaryEmail' },
        },
      },
    ],
  });

  if (!user) {
    // The authenticated user may have been deleted.
    throw forbidden();
  }

  return {
    email: user.primaryEmail,
    email_verified: user.primaryEmail ? user.EmailAuthorizations[0].verified : false,
    name: user.name,
    picture: getGravatarUrl(user.primaryEmail),
    sub: user.id,
    locale: user.locale,
    zoneinfo: user.timezone,
  };
}
