import Boom from 'boom';
import normalize from '@appsemble/utils/normalize';

import templates from '../templates/apps';

export async function getAppTemplates(ctx) {
  ctx.body = templates.map(({ name, description, resources }) => ({
    name,
    description,
    resources: !!resources,
  }));
}

export async function createTemplateApp(ctx) {
  const { template: reqTemplate, name, description, organizationId, resources } = ctx.request.body;
  const { App, Resource } = ctx.db.models;
  const { user } = ctx.state;

  const template = templates.find(t => t.name === reqTemplate);

  if (!user.organizations.some(organization => organization.id === organizationId)) {
    throw Boom.forbidden('User does not belong in this organization.');
  }

  if (!template) {
    throw Boom.notFound(`Template ${template} does not exist.`);
  }

  const app = await App.create(
    {
      definition: { ...template.definition, description, name: name || template },
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

  ctx.body = {
    ...app.definition,
    id: app.id,
    path: app.path,
    organizationId: app.OrganizationId,
  };
  ctx.status = 201;
}
