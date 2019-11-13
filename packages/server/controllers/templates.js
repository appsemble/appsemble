import { normalize } from '@appsemble/utils';
import Boom from '@hapi/boom';
import crypto from 'crypto';
import { col, fn, UniqueConstraintError } from 'sequelize';

import getAppFromRecord from '../utils/getAppFromRecord';

export async function getAppTemplates(ctx) {
  const { App, Resource } = ctx.db.models;

  const templates = await App.findAll({
    where: { template: true },
    attributes: ['id', 'definition', [fn('COUNT', col('Resources.id')), 'ResourceCount']],
    include: [{ model: Resource, attributes: [], duplicating: false }],
    group: ['App.id'],
  });

  ctx.body = templates.map(({ id, definition: { description, name }, ResourceCount }) => ({
    id,
    name,
    description,
    resources: !!ResourceCount,
  }));
}

export async function createTemplateApp(ctx) {
  const {
    templateId,
    name,
    description,
    organizationId,
    resources,
    private: isPrivate,
  } = ctx.request.body;
  const { App, Resource } = ctx.db.models;
  const { user } = ctx.state;

  const template = App.findOne({ where: { id: templateId, template: true }, include: [Resource] });

  if (!user.organizations.some(organization => organization.id === organizationId)) {
    throw Boom.forbidden('User does not belong in this organization.');
  }

  if (!template) {
    throw Boom.notFound(`Template with ID ${templateId} does not exist.`);
  }

  try {
    const path = name ? normalize(name) : normalize(template);
    const result = {
      definition: {
        ...template.definition,
        description,
        name: name || template,
      },
      private: Boolean(isPrivate),
      OrganizationId: organizationId,
      ...(resources && {
        Resources: [].concat(
          ...Object.keys(template.resources).map(key =>
            template.resources[key].map(r => ({ type: key, data: r })),
          ),
        ),
      }),
    };

    for (let i = 1; i < 11; i += 1) {
      const p = i === 1 ? path : `${path}-${i}`;
      // eslint-disable-next-line no-await-in-loop
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

    const record = await App.create(result, { raw: true, include: [Resource] });

    ctx.body = getAppFromRecord(record);
    ctx.status = 201;
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw Boom.conflict(
        `Another app with path “${name ? normalize(name) : normalize(template)}” already exists`,
      );
    }

    throw error;
  }
}
