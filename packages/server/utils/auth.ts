import { randomBytes } from 'node:crypto';

import { type Transaction } from 'sequelize';

import { argv } from './argv.js';
import { type Mailer } from './email/Mailer.js';
import {
  type App,
  type AppMember,
  EmailAuthorization,
  OrganizationMember,
  User,
} from '../models/index.js';

export async function processEmailAuthorization(
  mailer: Mailer,
  id: string,
  name: string,
  email: string,
  verified: boolean,
  transaction: Transaction,
): Promise<void> {
  const key = verified ? null : randomBytes(40).toString('hex');
  await EmailAuthorization.create(
    { UserId: id, email: email.toLowerCase(), key, verified },
    { transaction },
  );
  const user = await User.findByPk(id, { attributes: ['locale'] });
  if (!verified) {
    await mailer.sendTranslatedEmail({
      to: {
        name,
        email,
      },
      emailName: 'resend',
      ...(user ? { locale: user.locale } : {}),
      values: {
        link: (text) => `[${text}](${argv.host}/verify?token=${key})`,
        name: user ? user.name : 'null',
        appName: 'null',
      },
    });
  }
}

export async function checkAppSecurityPolicy(
  app: App,
  user: User,
  appMember: AppMember,
): Promise<boolean> {
  const policy = app.definition?.security?.default?.policy ?? 'everyone';

  if (policy === 'everyone') {
    return true;
  }

  if (policy === 'invite' && !appMember) {
    return false;
  }

  if (policy === 'organization') {
    return Boolean(
      await OrganizationMember.count({
        where: { OrganizationId: app.OrganizationId, UserId: user.id },
      }),
    );
  }
}
