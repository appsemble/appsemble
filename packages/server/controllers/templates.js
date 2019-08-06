import normalize from '@appsemble/utils/normalize';
import Boom from '@hapi/boom';
import { UniqueConstraintError } from 'sequelize';

import templates from '../templates/apps';
import getAppFromRecord from '../utils/getAppFromRecord';

export async function getAppTemplates(ctx) {
  ctx.body = templates.map(({ name, description, resources }) => ({
    name,
    description,
    resources: !!resources,
  }));
}

export async function createTemplateApp(ctx) {
  const {
    template: reqTemplate,
    name,
    description,
    organizationId,
    resources,
    private: isPrivate = true,
  } = ctx.request.body;
  const { App, Resource } = ctx.db.models;
  const { user } = ctx.state;

  const template = templates.find(t => t.name === reqTemplate);

  if (!user.organizations.some(organization => organization.id === organizationId)) {
    throw Boom.forbidden('User does not belong in this organization.');
  }

  if (!template) {
    throw Boom.notFound(`Template ${template} does not exist.`);
  }

  try {
    const app = await App.create(
      {
        definition: {
          ...template.definition,
          description,
          name: name || template,
          private: isPrivate,
        },
        OrganizationId: organizationId,
        path: name ? normalize(name) : normalize(template),
        ...(resources && {
          Resources: [].concat(
            ...Object.keys(template.resources).map(key =>
              template.resources[key].map(r => ({ type: key, data: r })),
            ),
          ),
        }),
      },
      { include: [Resource], raw: true },
    );

    ctx.body = getAppFromRecord(app);
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
