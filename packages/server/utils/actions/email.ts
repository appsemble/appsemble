import { defaultLocale, type EmailActionDefinition, remap } from '@appsemble/lang-sdk';
import { getRemapperContext, getS3FileBuffer, throwKoaError } from '@appsemble/node-utils';
import { extension } from 'mime-types';
import { type SendMailOptions } from 'nodemailer';
import { Op } from 'sequelize';

import { type ServerActionParameters } from './index.js';
import { Asset } from '../../models/index.js';
import { iterTable } from '../database.js';
import { renderEmail } from '../email/renderEmail.js';

interface ContentAttachment {
  filename?: string;
  accept?: string;
  content: string;
}

interface TargetAttachment {
  filename?: string;
  accept?: string;
  target: string;
}

function isContentAttachment(attachment: unknown): attachment is ContentAttachment {
  if (typeof attachment !== 'object') {
    return false;
  }
  if (!attachment) {
    return false;
  }
  const { content } = attachment as ContentAttachment;
  return content != null && typeof content === 'string';
}

function isTargetAttachment(attachment: unknown): attachment is TargetAttachment {
  if (typeof attachment !== 'object') {
    return false;
  }
  if (!attachment) {
    return false;
  }
  const { target } = attachment as TargetAttachment;
  return target != null && typeof target === 'string';
}

export async function email({
  action,
  app,
  context,
  data,
  internalContext,
  mailer,
  options,
}: ServerActionParameters<EmailActionDefinition>): Promise<any> {
  const remapperContext = await getRemapperContext(
    app.toJSON(),
    app.definition.defaultLanguage || defaultLocale,
    options,
    context,
  );

  Object.assign(remapperContext, {
    history: internalContext?.history ?? [],
  });
  const to = remap(action.to ?? null, data, remapperContext) as string;
  const from =
    (remap(action.from ?? null, data, remapperContext) as string) || app.emailName || 'Appsemble';
  const cc = remap(action.cc ?? null, data, remapperContext) as string[] | string;
  const bcc = remap(action.bcc ?? null, data, remapperContext) as string[] | string;
  const body = remap(action.body, data, remapperContext) as string;
  const sub = remap(action.subject, data, remapperContext) as string;

  if (!to && !cc?.length && !bcc?.length) {
    // Continue as normal without doing anything
    return data;
  }
  const ctx = context;

  if (!sub || !body) {
    throwKoaError(ctx, 400, 'Fields “subject” and “body” must be a valid string');
  }

  const attachments: SendMailOptions['attachments'] = [];
  const assetSelectors: TargetAttachment[] = [];
  for (const remapped of [remap(action.attachments ?? null, data, remapperContext)].flat()) {
    const attachment = typeof remapped === 'string' ? { target: String(remapped) } : remapped;
    if (isTargetAttachment(attachment)) {
      if (attachment.target.startsWith('http')) {
        attachments.push({
          path: attachment.target,
          ...(attachment.filename && { filename: attachment.filename }),
          ...(attachment.accept && { httpHeaders: { accept: attachment.accept } }),
        });
      } else {
        assetSelectors.push(attachment);
      }
    } else if (isContentAttachment(attachment)) {
      attachments.push({
        content: attachment.content,
        filename: attachment.filename,
      });
    }
  }
  if (assetSelectors.length) {
    const commonQuery = {
      [Op.in]: assetSelectors.map((selector) => selector.target),
    };
    for await (const asset of iterTable(Asset, {
      where: {
        AppId: app.id,
        [Op.or]: {
          id: commonQuery,
          name: commonQuery,
        },
      },
    })) {
      const attachment = assetSelectors.find((selector) => selector.target === asset.id);
      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
      const ext = extension(attachment?.accept || asset.mime);
      const filename =
        attachment?.filename || asset.filename || (ext ? `${asset.id}.${ext}` : asset.id);
      attachments.push({
        content: await getS3FileBuffer(`app-${app.id}`, asset.id),
        filename,
      });
    }
  }

  const { demoMode, emailHost, emailName, emailPassword, emailPort, emailSecure, emailUser } = app;
  const { html, subject, text } = await renderEmail(body, {}, sub);
  await mailer.sendEmail({
    ...(to && { to }),
    ...(cc && { cc }),
    ...(bcc && { bcc }),
    from,
    subject,
    html,
    text,
    attachments,
    app: {
      demoMode,
      emailHost,
      emailName,
      emailPassword,
      emailPort,
      emailSecure,
      emailUser,
      id: app.id,
    },
  });

  return data;
}
