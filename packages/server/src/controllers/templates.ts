import { normalize, Permission } from '@appsemble/utils';
import Boom from '@hapi/boom';
import crypto from 'crypto';
import { col, fn, UniqueConstraintError } from 'sequelize';
import { generateVAPIDKeys } from 'web-push';

import { App, Resource } from '../models';
import type { KoaContext } from '../types';
import checkRole from '../utils/checkRole';
import getAppFromRecord from '../utils/getAppFromRecord';

export async function getAppTemplates(ctx: KoaContext): Promise<void> {
  const templates = await App.findAll({
    where: { template: true },
    attributes: {
      include: ['id', 'definition', [fn('COUNT', col('Resources.id')), 'ResourceCount']],
    },
    include: [{ model: Resource, attributes: [] }],
    group: ['App.id'],
  });

  ctx.body = templates.map((template) => ({
    id: template.id,
    name: template.definition.name,
    description: template.definition.description,
    resources: template.get('ResourceCount') > 0,
  }));
}

export async function createTemplateApp(ctx: KoaContext): Promise<void> {
  const {
    request: {
      body: { description, name, organizationId, private: isPrivate, resources, templateId },
    },
  } = ctx;

  const template = await App.findOne({
    where: { id: templateId },
    include: [Resource],
  });

  await checkRole(ctx, organizationId, Permission.CreateApps);

  if (!template) {
    throw Boom.notFound(`Template with ID ${templateId} does not exist.`);
  }

  if (!template.template && template.private) {
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
      OrganizationId: organizationId,
      ...(resources && {
        Resources: [].concat(template.Resources.map(({ data, type }) => ({ type, data }))),
      }),
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
      result.path = `${path}-${crypto.randomBytes(5).toString('hex')}`;
    }

    const record = await App.create(result, { include: [Resource] });

    ctx.body = getAppFromRecord(record);
    ctx.status = 201;
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw Boom.conflict(`Another app with path “${path}” already exists`);
    }

    throw error;
  }
}
