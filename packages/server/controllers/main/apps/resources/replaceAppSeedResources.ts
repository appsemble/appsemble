import {
  assertKoaCondition,
  getResourceDefinition,
  processResourceBody,
  validateResourceReferences,
} from '@appsemble/node-utils';
import { OrganizationPermission, type Resource as ResourceInterface } from '@appsemble/types';
import { type Context } from 'koa';
import { type JsonObject } from 'type-fest';

import { App, getAppDB } from '../../../../models/index.js';
import { createAppResourcesWithAssets } from '../../../../options/createAppResourcesWithAssets.js';
import { getAppResources } from '../../../../options/getAppResources.js';
import { options } from '../../../../options/options.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';
import { deleteSeedResources } from '../../../../utils/deleteSeedResources.js';

export async function replaceAppSeedResources(ctx: Context): Promise<void> {
  const app = await App.findByPk(ctx.pathParams.appId);
  assertKoaCondition(app != null, ctx, 404, 'App not found');
  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [
      OrganizationPermission.CreateAppResources,
      OrganizationPermission.DeleteAppResources,
    ],
  });

  const batch: Record<string, JsonObject[]> = ctx.request.body;
  const ordered: string[] = [];
  const visiting = new Set<string>();
  const visit = (type: string): void => {
    if (ordered.includes(type)) {
      return;
    }
    assertKoaCondition(!visiting.has(type), ctx, 400, 'Cyclic seed resource references');
    visiting.add(type);
    const definition = getResourceDefinition(app.definition, type, ctx);
    for (const { resource } of Object.values(definition.references ?? {})) {
      if (batch[resource]) {
        visit(resource);
      }
    }
    visiting.delete(type);
    ordered.push(type);
  };
  for (const type of Object.keys(batch)) {
    visit(type);
  }

  const { Asset, sequelize } = await getAppDB(app.id);
  const assets = await Asset.findAll({ attributes: ['id', 'name'] });
  const prepared: Record<string, Record<string, unknown>[]> = {};
  const indexedProperties: Record<string, string[][]> = {};
  for (const type of ordered) {
    const definition = getResourceDefinition(app.definition, type);
    indexedProperties[type] = [];
    const resources = batch[type].map((resource, index) => {
      const value = { ...resource };
      indexedProperties[type][index] = [];
      for (const [property, reference] of Object.entries(definition.references ?? {})) {
        const offset = value[`$${reference.resource}`];
        if (!value[property] && offset != null) {
          assertKoaCondition(
            Number.isInteger(offset) &&
              Number(offset) >= 0 &&
              Number(offset) < (batch[reference.resource]?.length ?? 0),
            ctx,
            400,
            `Invalid seed reference ${type}[${index}].${property}`,
          );
          value[property] = Number(offset) + 1;
          indexedProperties[type][index].push(property);
        }
      }
      return value;
    });
    const [processed] = await processResourceBody(
      ctx,
      definition,
      assets.map(({ id }) => id),
      undefined,
      assets.map(({ id, name }) => ({ id, name })),
      false,
      resources,
    );
    prepared[type] = Array.isArray(processed) ? processed : [processed];
  }

  const published: Record<string, number[]> = {};
  await sequelize.transaction(async (transaction) => {
    await sequelize.query('LOCK TABLE "Resource" IN EXCLUSIVE MODE', { transaction });
    for (const type of ordered) {
      const references = prepared[type].map((resource, index) => {
        const explicit = { ...resource };
        for (const property of indexedProperties[type][index]) {
          delete explicit[property];
        }
        return explicit;
      });
      await validateResourceReferences(
        ctx,
        app.toJSON(),
        getResourceDefinition(app.definition, type),
        references,
        (params) =>
          getAppResources({
            ...params,
            findOptions: {
              ...params.findOptions,
              where: {
                ...params.findOptions.where,
                seed: false,
                ...(app.demoMode ? { ephemeral: false } : {}),
              },
            },
            transaction,
          }),
      );
    }

    await deleteSeedResources(app, ctx, transaction);
    for (const type of ordered) {
      if (!prepared[type].length) {
        published[type] = [];
        continue;
      }
      const definition = getResourceDefinition(app.definition, type);
      const resources = prepared[type].map((resource, index) => {
        const value = { ...resource };
        for (const property of indexedProperties[type][index]) {
          const referencedType = definition.references![property].resource;
          value[property] = published[referencedType][Number(resource[`$${referencedType}`])];
        }
        return value;
      });
      const create = (values: Record<string, unknown>[]): Promise<ResourceInterface[]> =>
        createAppResourcesWithAssets({
          app: app.toJSON(),
          context: ctx,
          resourceType: type,
          resources: values,
          preparedAssets: [],
          options,
          transaction,
        });
      const seeds = await create(
        resources.map((resource) => {
          const value: Record<string, unknown> = { ...resource, $seed: true, $ephemeral: false };
          if (app.demoMode) {
            for (const property of Object.keys(definition.references ?? {})) {
              delete value[property];
            }
          }
          return value;
        }),
      );
      const visible = app.demoMode
        ? await create(
            resources.map((resource) => ({
              ...resource,
              $seed: false,
              $ephemeral: true,
              $clonable: false,
            })),
          )
        : seeds;
      published[type] = visible.map(({ id }) => id);
    }
  });
  ctx.body = published;
}
