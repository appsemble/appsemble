import { randomBytes } from 'crypto';

import { normalize, Permission } from '@appsemble/utils';
import { conflict, notFound } from '@hapi/boom';
import { dump } from 'js-yaml';
import { Context } from 'koa';
import { UniqueConstraintError } from 'sequelize';
import { generateVAPIDKeys } from 'web-push';

import { App, AppBlockStyle, AppMessages, AppSnapshot, Resource, User } from '../models';
import { checkRole } from '../utils/checkRole';
import { getAppFromRecord } from '../utils/model';

export async function getAppTemplates(ctx: Context): Promise<void> {
  const templates = await App.findAll({
    where: { template: true },
    attributes: {
      include: ['id', 'definition'],
    },
    include: [{ model: Resource, where: { clonable: true }, attributes: ['id'], required: false }],
    order: [['id', 'ASC']],
  });

  ctx.body = templates.map((template) => ({
    id: template.id,
    name: template.definition.name,
    description: template.definition.description,
    resources: template.Resources.length > 0,
  }));
}

export async function createTemplateApp(ctx: Context): Promise<void> {
  const {
    request: {
      body: { description, name, organizationId, private: isPrivate, resources, templateId },
    },
  } = ctx;
  const user = ctx.user as User;

  /**
   * XXX: This should include the existing YAML definition
   * when we get around to editing the YAML’s name/description values
   */
  const template = await App.findOne({
    where: { id: templateId },
    include: [
      { model: Resource, where: { clonable: true }, required: false },
      { model: AppMessages, required: false },
      { model: AppBlockStyle, required: false },
    ],
  });

  await checkRole(ctx, organizationId, Permission.CreateApps);

  if (!template) {
    throw notFound(`Template with ID ${templateId} does not exist.`);
  }

  if (!template.template && template.private) {
    // Only allow cloning of private apps if the user is part of the template’s organization.
    await checkRole(ctx, template.OrganizationId, Permission.ViewApps);
  }

  const path = name ? normalize(name) : normalize(template.definition.name);
  try {
    const keys = generateVAPIDKeys();
    const result: Partial<App> = {
      definition: {
        ...template.definition,
        description,
        name: name || template,
      },
      private: Boolean(isPrivate),
      vapidPublicKey: keys.publicKey,
      vapidPrivateKey: keys.privateKey,
      coreStyle: template.coreStyle,
      sharedStyle: template.sharedStyle,
      OrganizationId: organizationId,
      ...(resources && {
        Resources: [].concat(template.Resources.map(({ data, type }) => ({ type, data }))),
      }),
      AppMessages: [].concat(template.AppMessages),
    };

    for (let i = 1; i < 11; i += 1) {
      const p = i === 1 ? path : `${path}-${i}`;
      const count = await App.count({ where: { path: p } });
      if (count === 0) {
        result.path = p;
        break;
      }
    }

    if (!result.path) {
      // Fallback if a suitable ID could not be found after trying for a while
      result.path = `${path}-${randomBytes(5).toString('hex')}`;
    }

    const record = await App.create(result, { include: [Resource, AppMessages] });
    const snapshot = await AppSnapshot.create({
      AppId: record.id,
      UserId: user.id,
      /**
       * XXX: Replace this with the template’s YAML but with the edited name and description
       */
      yaml: dump(result.definition),
    });
    record.AppSnapshots = [snapshot];
    if (template.AppBlockStyles.length) {
      await AppBlockStyle.bulkCreate(
        template.AppBlockStyles.map((blockStyle) => ({
          AppId: record.id,
          block: blockStyle.block,
          style: blockStyle.style,
        })),
      );
    }

    ctx.body = getAppFromRecord(record);
    ctx.status = 201;
  } catch (error: unknown) {
    if (error instanceof UniqueConstraintError) {
      throw conflict(`Another app with path “${path}” already exists`);
    }

    throw error;
  }
}
