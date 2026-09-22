import { type Context } from 'koa';
import { Op, type Transaction } from 'sequelize';

import { processHooks, processReferenceHooks, processReferenceTriggers } from './resource.js';
import { type App, getAppDB } from '../models/index.js';
import { options } from '../options/options.js';

export async function deleteSeedResources(
  app: App,
  context: Context,
  transaction: Transaction,
): Promise<void> {
  const { Resource } = await getAppDB(app.id);
  const where = { [Op.or]: [{ seed: true }, ...(app.demoMode ? [{ ephemeral: true }] : [])] };
  const resources = await Resource.findAll({ where, transaction });

  await Resource.destroy({ where: { ...where, ephemeral: false }, transaction });
  if (app.demoMode) {
    await Resource.destroy({ where: { ephemeral: true }, force: true, transaction });
  }

  for (const resource of resources) {
    await processReferenceTriggers(app, resource, 'delete', context, transaction);
  }

  transaction.afterCommit(() => {
    for (const resource of resources) {
      if (app.definition.resources?.[resource.type]) {
        processReferenceHooks(app, resource, 'delete', options, context);
        processHooks(app, resource, 'delete', options, context);
      }
    }
  });
}
