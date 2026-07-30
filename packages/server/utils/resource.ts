import {
  type AppDefinition,
  defaultLocale,
  type NotificationDefinition,
  remap,
  type ResourceDefinition,
} from '@appsemble/lang-sdk';
import {
  appWideGroupId,
  getRemapperContext,
  type Options,
  type QueryParams,
  throwKoaError,
} from '@appsemble/node-utils';
import { type DefaultContext, type DefaultState, type ParameterizedContext } from 'koa';
import {
  literal,
  type ModelStatic,
  Op,
  type Order,
  type WhereAttributeHashValue,
  type WhereOptions,
} from 'sequelize';
import { type Literal } from 'sequelize/types/utils';

import { type FieldType, odataFilterToSequelize, odataOrderbyToSequelize } from './odata.js';
import { sendNotification, type SendNotificationOptions } from './sendNotification.js';
import {
  type App,
  type AppSubscription,
  getAppDB,
  type Resource,
  trackBackgroundTask,
} from '../models/index.js';

export function renameOData(name: string): string {
  switch (name) {
    case '__created__':
      return 'created';
    case '__updated__':
      return 'updated';
    case '__author__':
      return 'AuthorId';
    case '__group__':
      return 'GroupId';
    case '__seed__':
      return 'seed';
    case '__ephemeral__':
      return 'ephemeral';
    case '__clonable__':
      return 'clonable';
    case 'id':
      return name;
    case 'Position':
      return 'Position';
    default:
      return `data.${name}`;
  }
}

export function renameODataWithCasting(name: string, type?: FieldType): Literal | string {
  switch (name) {
    case '__created__':
      return 'created';
    case '__updated__':
      return 'updated';
    case '__author__':
      return 'AuthorId';
    case '__group__':
      return 'GroupId';
    case 'id':
      return name;
    case 'Position':
      return 'Position';
    default:
      return type === 'string' ? `data.${name}` : literal(`("Resource"."data"#>'{${name}}')`);
  }
}

async function sendSubscriptionNotifications(
  app: App,
  notification: NotificationDefinition,
  resourceAppMemberId: string,
  resourceType: string,
  action: 'create' | 'delete' | 'update',
  resourceId: number,
  options: SendNotificationOptions,
): Promise<void> {
  const { AppMember, AppSubscription, ResourceSubscription } = await getAppDB(app.id);
  const to = notification.to || [];
  const roles = to.filter((n) => n !== '$author');
  const author = resourceAppMemberId && to.includes('$author');
  const subscribers = notification.subscribe;

  if (!roles.length && !author && !subscribers) {
    return;
  }

  const subscriptions: AppSubscription[] = [];

  if (roles.length || author) {
    const roleSubscribers = await AppSubscription.findAll({
      attributes: ['id', 'auth', 'p256dh', 'endpoint'],
      include: [
        {
          model: AppMember,
          attributes: [],
          required: true,
        },
      ],
    });

    subscriptions.push(...roleSubscribers);
  }

  if (subscribers) {
    const resourceSubscribers = await AppSubscription.findAll({
      attributes: ['id', 'auth', 'p256dh', 'endpoint'],
      include: [
        {
          model: ResourceSubscription,
          attributes: ['ResourceId'],
          where: {
            type: resourceType,
            action,
            ...(resourceId
              ? { ResourceId: { [Op.or]: [null, resourceId] } }
              : { ResourceId: null }),
          },
        },
      ],
    });

    subscriptions.push(...resourceSubscribers);
  }

  for (const subscription of subscriptions) {
    sendNotification(app, subscription, options);
  }
}

async function runHooks(
  app: App,
  resource: Resource,
  action: 'create' | 'delete' | 'update',
  options: Options,
  context: ParameterizedContext<DefaultState, DefaultContext, any>,
): Promise<void> {
  if (!resource) {
    return;
  }

  // Since we're accepting a resource from arguments, it's quite likely a defined one
  const resourceDefinition = app.definition.resources![resource.type]!;

  if (resourceDefinition[action]?.hooks?.notification) {
    const { notification } = resourceDefinition[action].hooks;
    const { data } = notification;

    const r = {
      ...resource.data,
      id: resource.id,
      $created: resource.created,
      $updated: resource.updated,
    };

    const remapperContext = await getRemapperContext(
      app.toJSON(),
      app.definition.defaultLanguage || defaultLocale,
      options,
      context,
    );

    const title = (data?.title ? remap(data.title, r, remapperContext) : resource.type) as string;
    const content = (
      data?.content
        ? remap(data.content, r, remapperContext)
        : `${action.charAt(0).toUpperCase()}${action.slice(1)}d ${resource.id}`
    ) as string;
    const link = data?.link ? remap(data.link, r, remapperContext) : undefined;

    await sendSubscriptionNotifications(
      app,
      notification,
      // Don't send notifications to the creator when creating
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      action === 'create' ? null : resource.AuthorId,
      resource.type,
      action,
      resource.id,
      {
        title,
        body: content,
        link,
      },
    );
  }
}

// Run resource notification hooks as tracked background work so a caller can leave it running after
// responding, without a teardown dropping the app database out from under its queries and without
// leaking an unhandled rejection.
export function processHooks(
  app: App,
  resource: Resource,
  action: 'create' | 'delete' | 'update',
  options: Options,
  context: ParameterizedContext<DefaultState, DefaultContext, any>,
): Promise<void> {
  return trackBackgroundTask(runHooks(app, resource, action, options, context));
}

async function runReferenceHooks(
  app: App,
  resource: Resource,
  action: 'create' | 'delete' | 'update',
  options: Options,
  context: ParameterizedContext<DefaultState, DefaultContext, any>,
): Promise<void> {
  const { Resource } = await getAppDB(app.id);
  if (!resource) {
    return;
  }
  await Promise.all(
    Object.entries(app.definition.resources?.[resource.type].references ?? {}).map(
      async ([propertyName, reference]) => {
        if (!reference[action]?.triggers?.length) {
          // Do nothing
          return;
        }

        const { triggers } = reference[action];
        const ids = [].concat(resource.data[propertyName]);
        const parents = await Resource.findAll({
          where: { id: ids, type: reference.resource },
        });

        await Promise.all(
          parents.map((parent) =>
            Promise.all(
              triggers.map((trigger) => processHooks(app, parent, trigger.type, options, context)),
            ),
          ),
        );
      },
    ),
  );
}

// Run resource reference hooks as tracked background work (see trackBackgroundTask).
export function processReferenceHooks(
  app: App,
  resource: Resource,
  action: 'create' | 'delete' | 'update',
  options: Options,
  context: ParameterizedContext<DefaultState, DefaultContext, any>,
): Promise<void> {
  return trackBackgroundTask(runReferenceHooks(app, resource, action, options, context));
}

export async function processReferenceTriggers(
  app: App,
  parent: Resource,
  action: 'create' | 'delete' | 'update',
  context: ParameterizedContext<DefaultState, DefaultContext, any>,
): Promise<void> {
  const { Resource } = await getAppDB(app.id);
  const resourceReferences = [];
  for (const [resourceName, resourceDefinition] of Object.entries(app.definition.resources || {})) {
    const [referencedProperty, referenceToParent] =
      Object.entries(resourceDefinition.references ?? {}).find(
        ([, reference]) => reference.resource === parent.type && Boolean(reference[action]),
      ) ?? [];

    if (referenceToParent) {
      // @ts-expect-error Messed up - Severe
      const { triggers } = referenceToParent[action];

      resourceReferences.push({
        childName: resourceName,
        referencedProperty,
        triggers,
      });
    }
  }

  const childResources: Record<string, Resource[]> = {};
  const childPromises = resourceReferences.map(async ({ childName, referencedProperty }) => {
    childResources[childName] = await Resource.findAll({
      where: { type: childName, [`data.${referencedProperty}`]: parent.id },
    });
  });

  await Promise.all(childPromises);

  const triggerPromises = [];
  for (const resourceReference of resourceReferences) {
    const { childName, referencedProperty, triggers } = resourceReference;

    if (childResources[childName].length > 0) {
      switch (action) {
        case 'delete':
          // @ts-expect-error 7006 Parameter implicitly has an 'any' type
          if (triggers.some((trigger) => !trigger.cascade)) {
            return throwKoaError(
              context,
              400,
              `Cannot delete resource ${parent.id}. There is a resource of type ${childName} that references it.`,
            );
          }
          break;
        default:
          break;
      }
    }

    for (const child of childResources[childName]) {
      triggerPromises.push(
        await Promise.all(
          // @ts-expect-error 7006 Parameter implicitly has an 'any' type
          triggers.map(async (trigger) => {
            switch (trigger.cascade) {
              case 'update':
                await child.update({
                  // @ts-expect-error 2464 Computed property must be of type ...
                  data: { ...child.data, [referencedProperty]: null },
                });
                break;
              case 'delete':
                await child.destroy();
                break;
              default:
                break;
            }
          }),
        ),
      );
    }
  }

  await Promise.all(triggerPromises);
}

/**
 * Build a Sequelize resource `GroupId` filter for operations that may span
 * multiple groups (query, delete).
 *
 * The app-wide scope (`appWideGroupId`, or an empty selection) matches
 * resources without a group; concrete ids match resources in those groups.
 *
 * @param selectedGroupId The selected group ids from the query parameters.
 * @returns A value for a resource `GroupId` where clause.
 */
export function getGroupIdWhere(
  selectedGroupId: number[] = [],
): WhereAttributeHashValue<number | null> {
  const groupIds = selectedGroupId.filter((id) => id > 0);
  const includeUngrouped = selectedGroupId.length === 0 || selectedGroupId.includes(appWideGroupId);

  if (!groupIds.length) {
    return null;
  }

  return includeUngrouped ? { [Op.or]: [{ [Op.in]: groupIds }, null] } : { [Op.in]: groupIds };
}

/**
 * Generate Sequelize filter objects based on ODATA filters present in the request.
 *
 * @param query The query parameters to extract the parameters from.
 * @returns An object containing the generated order and query options.
 */
export function parseQuery({
  $filter,
  $orderby,
  resourceDefinition,
  tableName,
}: Pick<QueryParams, '$filter' | '$orderby'> & {
  resourceDefinition: ResourceDefinition;
} & { tableName: string }): {
  order: Order;
  query: WhereOptions;
} {
  const order = $orderby
    ? odataOrderbyToSequelize(
        $orderby
          .replaceAll(/(^|\B)\$created(\b|$)/g, '__created__')
          .replaceAll(/(^|\B)\$updated(\b|$)/g, '__updated__'),
        renameODataWithCasting,
        resourceDefinition,
      )
    : undefined;
  const query = $filter
    ? odataFilterToSequelize(
        $filter
          .replaceAll(/(^|\B)\$created(\b|$)/g, '__created__')
          .replaceAll(/(^|\B)\$updated(\b|$)/g, '__updated__')
          .replaceAll(/(^|\B)\$author\/id(\b|$)/g, '__author__')
          .replaceAll(/(^|\B)\$group\/id(\b|$)/g, '__group__')
          .replaceAll(/(^|\B)\$clonable(\b|$)/g, '__clonable__')
          .replaceAll(/(^|\B)\$seed(\b|$)/g, '__seed__')
          .replaceAll(/(^|\B)\$ephemeral(\b|$)/g, '__ephemeral__'),
        tableName,
        renameOData,
        ['data'],
      )
    : undefined;

  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  return { order, query };
}

export async function reseedResourcesRecursively(
  appDefinition: AppDefinition,
  Resource: ModelStatic<Resource>,
  resourcesToReseed: Resource[],
  reseededResourcesIds: Record<string, number[]> = {},
): Promise<Record<string, number[]>> {
  const groupedResources: Record<string, Resource[]> = {};

  for (const resource of resourcesToReseed) {
    groupedResources[resource.type] = [...(groupedResources[resource.type] ?? []), resource];
  }

  let updatedReseededResourcesIds: Record<string, number[]> = { ...reseededResourcesIds };
  for (const [resourceType, resources] of Object.entries(groupedResources)) {
    const resourceReferences = appDefinition.resources?.[resourceType]?.references;
    if (resourceReferences) {
      for (const [referencedProperty, resourceReference] of Object.entries(resourceReferences)) {
        const referencedResourceType = resourceReference.resource;
        const referencedResourcesToReseed = groupedResources[referencedResourceType];

        if (!updatedReseededResourcesIds[referencedResourceType]) {
          const referencedReseededResourcesIds = await reseedResourcesRecursively(
            appDefinition,
            Resource,
            referencedResourcesToReseed,
            updatedReseededResourcesIds,
          );

          updatedReseededResourcesIds = {
            ...updatedReseededResourcesIds,
            ...referencedReseededResourcesIds,
          };
        }

        if (!updatedReseededResourcesIds[resourceType]) {
          const reseededResources = [];
          for (const resource of resources) {
            reseededResources.push(
              await Resource.create({
                ...resource.dataValues,
                ephemeral: true,
                seed: false,
                data: {
                  ...resource.dataValues.data,
                  [referencedProperty]:
                    updatedReseededResourcesIds[referencedResourceType][
                      resource.dataValues.data[`$${referencedResourceType}`]
                    ],
                },
              }),
            );
          }
          updatedReseededResourcesIds[resourceType] = reseededResources.map(
            (resource) => resource.id,
          );
        }
      }
    }

    if (!updatedReseededResourcesIds[resourceType]) {
      const reseededResources = [];
      for (const resource of resources) {
        reseededResources.push(
          await Resource.create({
            ...resource.dataValues,
            ephemeral: true,
            seed: false,
          }),
        );
      }
      updatedReseededResourcesIds[resourceType] = reseededResources.map((resource) => resource.id);
    }
  }

  return updatedReseededResourcesIds;
}
