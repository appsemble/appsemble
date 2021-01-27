import { NotificationDefinition } from '@appsemble/types';
import { remap } from '@appsemble/utils';
import { parseISO } from 'date-fns';
import { Schema, ValidationError, Validator } from 'jsonschema';
import { File } from 'koas-body-parser';
import { Op } from 'sequelize';
import { JsonObject } from 'type-fest';
import { v4 } from 'uuid';

import {
  App,
  AppSubscription,
  Asset,
  EmailAuthorization,
  Resource,
  ResourceSubscription,
  User,
} from '../models';
import { KoaContext } from '../types';
import { getRemapperContext } from './app';
import { handleValidatorResult } from './jsonschema';
import { sendNotification, SendNotificationOptions } from './sendNotification';

export function renameOData(name: string): string {
  switch (name) {
    case '__created__':
      return 'created';
    case '__updated__':
      return 'updated';
    case '__author__':
      return 'UserId';
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

  subscriptions.forEach((subscription) => {
    sendNotification(app, subscription, options);
  });
}

export async function processHooks(
  user: User,
  app: App,
  resource: Resource,
  action: 'create' | 'delete' | 'update',
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
        email_verified: Boolean(user.EmailAuthorizations?.[0]?.verified),
      },
    );

    const title = (data?.title ? remap(data.title, r, remapperContext) : resource.type) as string;
    const content = (data?.content
      ? remap(data.content, r, remapperContext)
      : `${action.charAt(0).toUpperCase()}${action.slice(1)}d ${resource.id}`) as string;

    await sendSubscriptionNotifications(
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
  user: User,
  app: App,
  resource: Resource,
  action: 'create' | 'delete' | 'update',
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
            Promise.all(trigger.map((t) => processHooks(user, app, parent, t))),
          ),
        );
      },
    ),
  );
}

export function processResourceBody(ctx: KoaContext): [JsonObject, File[], Date, boolean] {
  let body;
  let assets: File[];
  if (ctx.is('multipart/form-data')) {
    ({ assets, resource: body } = ctx.request.body);
  } else {
    ({ body } = ctx.request);
    assets = [];
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { $clonable, $expires, id, ...resource } = body;
  return [resource, assets, $expires ? parseISO($expires) : null, Boolean($clonable)];
}

export function verifyResourceBody(
  type: string,
  schema: Schema,
  resource: any,
  assets: File[] = [],
  knownAssetIds: string[] = [],
): [Pick<Asset, 'data' | 'data' | 'filename' | 'mime'>[], string[]] {
  const validator = new Validator();
  const assetIdMap = new Map<number, string>();
  const assetUsedMap = new Map<number, boolean>();
  const reusedAssets = new Set<string>();
  const preparedAssets = assets.map(({ contents, filename, mime }, index) => {
    const id = v4();
    assetIdMap.set(index, id);
    assetUsedMap.set(index, false);
    return { data: contents, filename, id, mime };
  });
  validator.customFormats.binary = (input) => {
    if (knownAssetIds.includes(input)) {
      reusedAssets.add(input);
      return true;
    }
    if (!/^\d+$/.test(input)) {
      return false;
    }
    const num = Number(input);
    return num >= 0 && num < assets.length;
  };

  const result = validator.validate(resource, schema, {
    base: '#',
    rewrite(value, { format }) {
      if (format !== 'binary') {
        return value;
      }
      if (knownAssetIds.includes(value)) {
        return value;
      }
      assetUsedMap.set(Number(value), true);
      return assetIdMap.get(Number(value));
    },
  });

  assetUsedMap.forEach((used, assetId) => {
    if (!used) {
      result.errors.push(
        new ValidationError(
          'is not referenced from the resource',
          assetId,
          null,
          ['assets', assetId],
          'binary',
          'format',
        ),
      );
    }
  });

  handleValidatorResult(result, `Validation failed for resource type ${type}`);

  return [preparedAssets, knownAssetIds.filter((id) => !reusedAssets.has(id))];
}
