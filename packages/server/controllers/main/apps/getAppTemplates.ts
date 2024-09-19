import { type Context } from 'koa';

import { App, Resource } from '../../../models/index.js';

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
