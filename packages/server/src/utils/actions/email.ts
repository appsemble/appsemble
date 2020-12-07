import { EmailActionDefinition } from '@appsemble/types';
import { remap } from '@appsemble/utils';
import { badRequest } from '@hapi/boom';
import { extension } from 'mime-types';
import { SendMailOptions } from 'nodemailer';
import { Op } from 'sequelize';

import { ServerActionParameters } from '.';
import { Asset, EmailAuthorization } from '../../models';
import { getRemapperContext } from '../app';
import { renderEmail } from '../email/renderEmail';

interface Attachment {
  filename?: string;
  accept?: string;
  target: string;
}

export async function email({
  action,
  app,
  data,
  mailer,
  user,
}: ServerActionParameters<EmailActionDefinition>): Promise<any> {
  await user?.reload({
    attributes: ['primaryEmail', 'name'],
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

  const context = await getRemapperContext(
    app,
    app.definition.defaultLanguage || 'en-us',
    user && {
      sub: user.id,
      name: user.name,
      email: user.primaryEmail,
      email_verified: user.EmailAuthorizations[0].verified,
    },
  );

  const to = remap(action.to, data, context) as string;
  const cc = remap(action.cc, data, context) as string | string[];
  const bcc = remap(action.bcc, data, context) as string | string[];
  const body = remap(action.body, data, context) as string;
  const sub = remap(action.subject, data, context) as string;
  const attachmentUrls = []
    .concat(remap(action.attachments, data, context) as (string | Attachment)[])
    .filter(Boolean)
    .map((a) => (typeof a === 'object' ? a : { target: String(a) }));
  const attachments: SendMailOptions['attachments'] = [];

  if (!to && !cc?.length && !bcc?.length) {
    // Continue as normal without doing anything
    return data;
  }

  if (!sub || !body) {
    throw badRequest('Fields “subject” and “body” must be a valid string');
  }

  if (attachmentUrls?.length) {
    const assetIds = attachmentUrls.filter((a) => !String(a.target).startsWith('http'));
    const assetUrls = attachmentUrls.filter((a) => String(a.target).startsWith('http'));
    const assets = await Asset.findAll({
      where: { AppId: app.id, id: assetIds.map((a) => a.target) },
    });

    attachments.push(
      ...assets.map((a) => {
        const attachment = assetIds.find((aId) => aId.target === String(a.id));
        const ext = extension(attachment?.accept || a.mime);
        const filename =
          attachment?.filename || a.filename || (ext ? `${a.id}.${ext}` : String(a.id));
        return { content: a.data, filename };
      }),
    );
    attachments.push(
      ...assetUrls.map((a) => ({
        path: a.target,
        ...(a.filename && { filename: a.filename }),
        ...(a.accept && { httpHeaders: { accept: a.accept } }),
      })),
    );
  }

  const { html, subject, text } = await renderEmail(body, {}, sub);
  await mailer.sendEmail({
    ...(to && { to }),
    ...(cc && { cc }),
    ...(bcc && { bcc }),
    subject,
    html,
    text,
    attachments,
  });

  return data;
}
