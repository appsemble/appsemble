import { getRemapperContext } from '@appsemble/node-utils/app';
import { Options } from '@appsemble/node-utils/server/types';
import { NotificationDefinition } from '@appsemble/types';
import { defaultLocale, remap } from '@appsemble/utils';
import { DefaultContext, DefaultState, ParameterizedContext } from 'koa';
import { QueryParams } from 'koas-parameters';
import { Op, Order, WhereOptions } from 'sequelize';

import {
  App,
  AppSubscription,
  EmailAuthorization,
  Resource,
  ResourceSubscription,
  User,
} from '../models/index.js';
import { odataFilterToSequelize, odataOrderbyToSequelize } from './odata.js';
import { sendNotification, SendNotificationOptions } from './sendNotification.js';

export function renameOData(name: string): string {
  switch (name) {
    case '__created__':
      return 'created';
    case '__updated__':
      return 'updated';
    case '__author__':
      return 'AuthorId';
    case 'id':
      return name;
    default:
      return `data.${name}`;
  }
}

async function sendSubscriptionNotifications(
  app: App,
  notification: NotificationDefinition,
  resourceUserId: string,
  resourceType: string,
  action: 'create' | 'delete' | 'update',
  resourceId: number,
  options: SendNotificationOptions,
): Promise<void> {
  const to = notification.to || [];
  const roles = to.filter((n) => n !== '$author');
  const author = resourceUserId && to.includes('$author');
  const subscribers = notification.subscribe;

  if (!roles.length && !author && !subscribers) {
    return;
  }

  const subscriptions: AppSubscription[] = [];

  if (roles.length || author) {
    const roleSubscribers = await AppSubscription.findAll({
      where: { AppId: app.id },
      attributes: ['id', 'auth', 'p256dh', 'endpoint'],
      include: [
        {
          model: User,
          attributes: [],
          required: true,
          include: [
            {
              model: App,
              attributes: [],
              where: { id: app.id },
              through: {
                attributes: [],
                where: {
                  [Op.or]: [
                    ...(author ? [{ UserId: resourceUserId }] : []),
                    ...(roles.length ? [{ role: roles }] : []),
                  ],
                },
              },
            },
          ],
        },
      ],
    });

    subscriptions.push(...roleSubscribers);
  }

  if (subscribers) {
    const resourceSubscribers = await AppSubscription.findAll({
      attributes: ['id', 'auth', 'p256dh', 'endpoint'],
      where: { AppId: app.id },
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

export async function processHooks(
  user: User,
  app: App,
  resource: Resource,
  action: 'create' | 'delete' | 'update',
  options: Options,
  context: ParameterizedContext<DefaultState, DefaultContext, any>,
): Promise<void> {
  const resourceDefinition = app.definition.resources[resource.type];

  await user?.reload({
    attributes: ['primaryEmail', 'name', 'timezone'],
    include: [
      {
        required: false,
        model: EmailAuthorization,
        attributes: ['verified'],
        where: {
          email: { [Op.col]: 'User.primaryEmail' },
        },
      },
    ],
  });

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
      user && {
        sub: user.id,
        name: user.name,
        email: user.primaryEmail,
        email_verified: Boolean(user.EmailAuthorizations?.[0]?.verified),
        zoneinfo: user.timezone,
      },
      options,
      context,
    );

    const title = (data?.title ? remap(data.title, r, remapperContext) : resource.type) as string;
    const content = (
      data?.content
        ? remap(data.content, r, remapperContext)
        : `${action.charAt(0).toUpperCase()}${action.slice(1)}d ${resource.id}`
    ) as string;

    await sendSubscriptionNotifications(
      app,
      notification,
      // Don't send notifications to the creator when creating
      action === 'create' ? null : resource.AuthorId,
      resource.type,
      action,
      resource.id,
      {
        title,
        body: content,
      },
    );
  }
}

export async function processReferenceHooks(
  user: User,
  app: App,
  resource: Resource,
  action: 'create' | 'delete' | 'update',
  options: Options,
  context: ParameterizedContext<DefaultState, DefaultContext, any>,
): Promise<void> {
  await Promise.all(
    Object.entries(app.definition.resources[resource.type].references || {}).map(
      async ([propertyName, reference]) => {
        if (!reference[action]?.trigger?.length) {
          // Do nothing
          return;
        }

        const { trigger } = reference[action];
        const ids = [].concat(resource.data[propertyName]);
        const parents = await Resource.findAll({
          where: { id: ids, type: reference.resource, AppId: app.id },
        });

        await Promise.all(
          parents.map((parent) =>
            Promise.all(trigger.map((t) => processHooks(user, app, parent, t, options, context))),
          ),
        );
      },
    ),
  );
}

/**
 * Generate Sequelize filter objects based on ODATA filters present in the request.
 *
 * @param query The query parameters to extract the parameters from.
 * @returns An object containing the generated order and query options.
 */
export function parseQuery({ $filter, $orderby }: Pick<QueryParams, '$filter' | '$orderby'>): {
  order: Order;
  query: WhereOptions;
} {
  const order = $orderby
    ? odataOrderbyToSequelize(
        $orderby
          .replace(/(^|\B)\$created(\b|$)/g, '__created__')
          .replace(/(^|\B)\$updated(\b|$)/g, '__updated__'),
        renameOData,
      )
    : undefined;
  const query = $filter
    ? odataFilterToSequelize(
        $filter
          .replace(/(^|\B)\$created(\b|$)/g, '__created__')
          .replace(/(^|\B)\$updated(\b|$)/g, '__updated__')
          .replace(/(^|\B)\$author\/id(\b|$)/g, '__author__'),
        Resource,
        renameOData,
      )
    : undefined;

  return { order, query };
}
