import type { NotificationDefinition } from '@appsemble/types';
import { remap } from '@appsemble/utils';
import { Op } from 'sequelize';

import {
  App,
  AppSubscription,
  EmailAuthorization,
  Resource,
  ResourceSubscription,
  User,
} from '../models';
import { getRemapperContext } from './app';
import { sendNotification, SendNotificationOptions } from './sendNotification';

export function renameOData(name: string): string {
  switch (name) {
    case '__created__':
      return 'created';
    case '__updated__':
      return 'updated';
    case 'id':
      return name;
    default:
      return `data.${name}`;
  }
}

async function sendSubscriptionNotifications(
  host: string,
  app: App,
  notification: NotificationDefinition,
  resourceUserId: string,
  resourceType: string,
  action: 'create' | 'update' | 'delete',
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

  subscriptions.forEach((subscription) => {
    sendNotification(host, app, subscription, options);
  });
}

export async function processHooks(
  host: string,
  user: User,
  app: App,
  resource: Resource,
  action: 'create' | 'update' | 'delete',
): Promise<void> {
  const resourceDefinition = app.definition.resources[resource.type];

  await user?.reload({
    attributes: ['primaryEmail', 'name'],
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
      app,
      app.definition.defaultLanguage || 'en-us',
      user && {
        sub: user.id,
        name: user.name,
        email: user.primaryEmail,
        email_verified: user.EmailAuthorizations[0].verified,
      },
    );

    const title = (data?.title ? remap(data.title, r, remapperContext) : resource.type) as string;
    const content = (data?.content
      ? remap(data.content, r, remapperContext)
      : `${action.charAt(0).toUpperCase()}${action.slice(1)}d ${resource.id}`) as string;

    await sendSubscriptionNotifications(
      host,
      app,
      notification,
      // Don't send notifications to the creator when creating
      action === 'create' ? null : resource.UserId,
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
  host: string,
  user: User,
  app: App,
  resource: Resource,
  action: 'create' | 'update' | 'delete',
): Promise<void> {
  await Promise.all(
    Object.entries(app.definition.resources[resource.type].references || {}).map(
      async ([propertyName, reference]) => {
        if (!reference[action] || !reference[action].trigger || !reference[action].trigger.length) {
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
            Promise.all(trigger.map((t) => processHooks(host, user, app, parent, t))),
          ),
        );
      },
    ),
  );
}
