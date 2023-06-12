import { getRemapperContext, type Options, handleValidatorResult } from '@appsemble/node-utils';
import {
  type NotificationDefinition,
  type ResourceDefinition,
  type Resource as ResourceType,
} from '@appsemble/types';
import { defaultLocale, remap } from '@appsemble/utils';
import { addMilliseconds, isPast, parseISO } from 'date-fns';
import { ValidationError, Validator } from 'jsonschema';
import { type DefaultContext, type DefaultState, type ParameterizedContext } from 'koa';
import { type QueryParams } from 'koas-parameters';
import parseDuration from 'parse-duration';
import { Op, type Order, type WhereOptions } from 'sequelize';

import { odataFilterToSequelize, odataOrderbyToSequelize } from './odata.js';
import { sendNotification, type SendNotificationOptions } from './sendNotification.js';
import {
  App,
  AppSubscription,
  EmailAuthorization,
  Resource,
  ResourceSubscription,
  User,
} from '../models/index.js';

function stripResource({
  $author,
  $created,
  $editor,
  $updated,
  ...data
}: ResourceType): Record<string, unknown> {
  return data;
}

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
 * Process resource data.
 *
 * This handles JSON schema validation, resource expiration, and validation.
 *
 * @param resource The resource to process.
 * @param definition The resource definition to use for processing the request body.
 * @param isPatch The "HTTP" method used.
 * @param knownExpires A previously known expires value.
 * @returns One or more resources.
 */
export function validate(
  resource: Record<string, unknown> | Record<string, unknown>[],
  definition: ResourceDefinition,
  isPatch = false,
  knownExpires?: Date,
): Record<string, unknown> | Record<string, unknown>[] {
  // TODO: unify validate with extractResourceBody to support Koa context and direct object inputs
  const validator = new Validator();
  const patchedSchema = {
    ...definition.schema,
    required: isPatch ? [] : definition.schema.required,
    properties: {
      ...definition.schema.properties,
      id: { type: 'integer' },
      $expires: { type: 'string', format: 'date-time' },
      $clonable: { type: 'boolean' },
    },
  };
  const customErrors: ValidationError[] = [];
  const expiresDuration = definition.expires ? parseDuration(definition.expires) : undefined;
  const strippedResource = Array.isArray(resource)
    ? resource.map(stripResource)
    : stripResource(resource as ResourceType);
  const result = validator.validate(
    strippedResource,
    Array.isArray(strippedResource) ? { type: 'array', items: patchedSchema } : patchedSchema,
    {
      base: '#',
      nestedErrors: true,
      rewrite(value, { format }, options, { path }) {
        if (
          Array.isArray(strippedResource)
            ? path.length === 2 && typeof path[0] === 'number' && path[1] === '$expires'
            : path.length === 1 && path[0] === '$expires'
        ) {
          if (value !== undefined) {
            const date = parseISO(value);
            if (isPast(date)) {
              customErrors.push(new ValidationError('has already passed', value, null, path));
            }
            return date;
          }
          if (knownExpires) {
            return knownExpires;
          }
          if (expiresDuration) {
            return addMilliseconds(new Date(), expiresDuration);
          }
        }
        if (value === undefined) {
          return;
        }
        if (format !== 'binary') {
          return value;
        }
      },
    },
  );

  result.errors.push(...customErrors);

  handleValidatorResult(result, 'Resource validation failed');

  return strippedResource;
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
