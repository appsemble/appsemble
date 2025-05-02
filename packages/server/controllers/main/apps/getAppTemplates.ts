import { type Context } from 'koa';

import { App, getAppDB } from '../../../models/index.js';

export async function getAppTemplates(ctx: Context): Promise<void> {
  const templates = await App.findAll({
    where: { template: true },
    attributes: { include: ['id', 'definition'] },
    order: [['id', 'ASC']],
  });

  ctx.body = await Promise.all(
    templates.map(async (template) => {
      const { Resource } = await getAppDB(template.id);
      const clonableResourcesCount = await Resource.count({ where: { clonable: true } });
      return {
        id: template.id,
        name: template.definition.name,
        description: template.definition.description,
        resources: clonableResourcesCount > 0,
      };
    }),
  );
}
