import { type Remapper } from '@appsemble/lang-sdk';
import { type AppMemberGroup } from '@appsemble/types';
import axios from 'axios';

import { type ActionCreator } from './index.js';
import { request } from './request.js';
import { type ServiceWorkerRegistrationContextType } from '../../types.js';
import { apiUrl, appId } from '../settings.js';

/**
 * Resolve the `selectedGroupId` query value.
 *
 * The value defined on the action takes precedence. Otherwise it is inferred from the
 * `selectedGroupId` input property, falling back to the app member's currently selected group.
 *
 * @param selectedGroup The app member's currently selected group, if any.
 * @param override The `selectedGroupId` remapper defined on the action, if any.
 * @returns A remapper resolving to the effective selected group id.
 */
function selectedGroupIdRemapper(
  selectedGroup: AppMemberGroup | undefined,
  override: Remapper | undefined,
): Remapper {
  if (override != null) {
    return override;
  }
  return {
    if: {
      condition: { defined: { prop: 'selectedGroupId' } },
      then: { prop: 'selectedGroupId' },
      else: selectedGroup?.id ?? null,
    },
  };
}

export const historyGet: ActionCreator<'resource.history.get'> = (args) => {
  const { appDefinition, definition, getAppMemberSelectedGroup } = args;
  const resource = appDefinition.resources?.[definition.resource];
  // @ts-expect-error Messed up
  const { id = 'id' } = resource;

  const selectedGroupId = getAppMemberSelectedGroup?.();
  return request({
    ...args,
    definition: {
      ...definition,
      query:
        selectedGroupId || definition.selectedGroupId
          ? {
              'object.assign': {
                selectedGroupId: selectedGroupIdRemapper(
                  selectedGroupId,
                  definition.selectedGroupId,
                ),
              },
            }
          : undefined,
      method: 'GET',
      proxy: false,
      type: 'request',
      url: {
        'string.format': {
          template: `${apiUrl}/api/apps/${appId}/resources/${definition.resource}/{id}/versions`,
          values: { id: { prop: id as string } },
        },
      },
      schema: resource?.schema,
    },
  });
};

export const get: ActionCreator<'resource.get'> = (args) => {
  const { appDefinition, definition, getAppMemberSelectedGroup } = args;
  const { view } = definition;
  const resource = appDefinition.resources?.[definition.resource];
  const method = resource?.get?.method || 'GET';
  const url =
    resource?.get?.url ??
    resource?.url ??
    `${apiUrl}/api/apps/${appId}/resources/${definition.resource}`;
  // @ts-expect-error Messed up
  const { id = 'id' } = resource;

  const query: Remapper = ([] as any[])
    .concat(definition?.query ?? resource?.query?.query ?? null)
    .filter(Boolean);

  if (view) {
    query.push({ 'object.assign': { view } });
  }

  const selectedGroup = getAppMemberSelectedGroup?.();
  if (selectedGroup || definition.selectedGroupId) {
    query.push({
      'object.assign': {
        selectedGroupId: selectedGroupIdRemapper(selectedGroup, definition.selectedGroupId),
      },
    });
  }

  if (selectedGroup) {
    query.push({ 'object.assign': { author: selectedGroup?.id } });
  }

  return request({
    ...args,
    definition: {
      ...definition,
      query: query.length ? query : undefined,
      method,
      proxy: false,
      type: 'request',
      url: {
        'string.format': {
          template: `${url}${url.endsWith('/') ? '' : '/'}{id}`,
          values: { id: definition.id ?? { prop: id as string } },
        },
      },
      schema: resource?.schema,
    },
  });
};

export const query: ActionCreator<'resource.query'> = (args) => {
  const { appDefinition, definition, getAppMemberSelectedGroup } = args;
  const { own, view } = definition;
  const resource = appDefinition.resources?.[definition.resource];
  const method = resource?.query?.method || 'GET';
  const url =
    resource?.query?.url ??
    resource?.url ??
    `${apiUrl}/api/apps/${appId}/resources/${definition.resource}`;

  const queryRemapper: Remapper = ([] as any[])
    .concat(definition?.query ?? resource?.query?.query ?? null)
    .filter(Boolean);

  if (view) {
    queryRemapper.push({ 'object.assign': { view } });
  }

  if (own) {
    queryRemapper.push({ 'object.assign': { $own: own } });
  }

  const selectedGroup = getAppMemberSelectedGroup?.();
  if (selectedGroup || definition.selectedGroupId) {
    queryRemapper.push({
      'object.assign': {
        selectedGroupId: selectedGroupIdRemapper(selectedGroup, definition.selectedGroupId),
      },
    });
  }

  return request({
    ...args,
    definition: {
      ...definition,
      query: queryRemapper.length ? queryRemapper : undefined,
      method,
      proxy: false,
      type: 'request',
      url,
      schema: resource?.schema,
    },
  });
};

export const count: ActionCreator<'resource.count'> = (args) => {
  const { appDefinition, definition, getAppMemberSelectedGroup } = args;
  const { own } = definition;
  const resource = appDefinition.resources?.[definition.resource];
  const method = resource?.count?.method || 'GET';
  const url =
    resource?.count?.url ??
    resource?.url ??
    `${apiUrl}/api/apps/${appId}/resources/${definition.resource}/$count`;

  const queryRemapper: Remapper = ([] as any[])
    .concat(definition?.query ?? resource?.count?.query ?? null)
    .filter(Boolean);

  if (own) {
    queryRemapper.push({ 'object.assign': { $own: own } });
  }

  const selectedGroup = getAppMemberSelectedGroup?.();
  if (selectedGroup || definition.selectedGroupId) {
    queryRemapper.push({
      'object.assign': {
        selectedGroupId: selectedGroupIdRemapper(selectedGroup, definition.selectedGroupId),
      },
    });
  }

  return request({
    ...args,
    definition: {
      ...definition,
      query: queryRemapper.length ? queryRemapper : undefined,
      method,
      proxy: false,
      type: 'request',
      url,
      schema: resource?.schema,
    },
  });
};

export const create: ActionCreator<'resource.create'> = (args) => {
  const { appDefinition, definition, getAppMemberSelectedGroup } = args;
  const resource = appDefinition.resources?.[definition.resource];
  const method = resource?.create?.method || 'POST';
  const url =
    resource?.create?.url ||
    resource?.url ||
    `${apiUrl}/api/apps/${appId}/resources/${definition.resource}`;

  const queryRemapper: Remapper = ([] as any[])
    .concat(definition?.query ?? resource?.create?.query ?? null)
    .filter(Boolean);

  const selectedGroup = getAppMemberSelectedGroup?.();
  if (selectedGroup || definition.selectedGroupId) {
    queryRemapper.push({
      'object.assign': {
        selectedGroupId: selectedGroupIdRemapper(selectedGroup, definition.selectedGroupId),
      },
    });
  }

  const [dispatch, properties] = request({
    ...args,
    definition: {
      ...definition,
      query: queryRemapper.length ? queryRemapper : undefined,
      method,
      proxy: false,
      type: 'request',
      url,
      schema: resource?.schema,
    },
  });
  return [dispatch, { ...properties, type: 'resource.create' }];
};

export const update: ActionCreator<'resource.update'> = (args) => {
  const { appDefinition, definition, getAppMemberSelectedGroup } = args;
  const resource = appDefinition.resources?.[definition.resource];
  const method = resource?.update?.method || 'PUT';
  const url =
    resource?.update?.url ||
    resource?.url ||
    `${apiUrl}/api/apps/${appId}/resources/${definition.resource}`;
  // @ts-expect-error Messed up
  const { id = 'id' } = resource;

  const queryRemapper: Remapper = ([] as any[])
    .concat(definition?.query ?? resource?.update?.query ?? null)
    .filter(Boolean);

  const selectedGroup = getAppMemberSelectedGroup?.();
  if (selectedGroup || definition.selectedGroupId) {
    queryRemapper.push({
      'object.assign': {
        selectedGroupId: selectedGroupIdRemapper(selectedGroup, definition.selectedGroupId),
      },
    });
  }

  return request({
    ...args,
    definition: {
      ...definition,
      query: queryRemapper.length ? queryRemapper : undefined,
      method,
      proxy: false,
      type: 'request',
      url: {
        'string.format': {
          template: `${url}${url.endsWith('/') ? '' : '/'}{id}`,
          values: { id: { prop: id as string } },
        },
      },
      schema: resource?.schema,
    },
  });
};

export const updateGroup: ActionCreator<'resource.update.group'> = (args) => {
  const { appDefinition, definition, getAppMemberSelectedGroup } = args;
  const { query: actionQuery, resource: resourceType } = definition;
  const queryRemapper = ([] as any[]).concat(actionQuery).filter(Boolean);
  const selectedGroup = getAppMemberSelectedGroup?.();
  if (selectedGroup || definition.selectedGroupId) {
    queryRemapper.push({
      'object.assign': {
        selectedGroupId: selectedGroupIdRemapper(selectedGroup, definition.selectedGroupId),
      },
    });
  }
  const resource = appDefinition.resources?.[resourceType];
  const method = 'PUT';
  const url = `${apiUrl}/api/apps/${appId}/resources/${resourceType}`;
  // @ts-expect-error Messed up
  const { id = 'id' } = resource;
  return request({
    ...args,
    definition: {
      ...definition,
      body: {
        'object.from': {
          groupId: definition.groupId ?? { prop: 'groupId' },
        },
      },
      method,
      query: queryRemapper,
      proxy: false,
      type: 'request',
      url: {
        'string.format': {
          template: `${url}${url.endsWith('/') ? '' : '/'}{id}/group`,
          values: { id: definition.id ?? { prop: id as string } },
        },
      },
      schema: resource?.schema,
    },
  });
};

export const updatePositions: ActionCreator<'resource.update.positions'> = (args) => {
  const { appDefinition, definition, getAppMemberSelectedGroup } = args;
  const { query: actionQuery, resource: resourceType } = definition;
  const queryRemapper = ([] as any[]).concat(actionQuery).filter(Boolean);
  const selectedGroup = getAppMemberSelectedGroup?.();
  if (selectedGroup || definition.selectedGroupId) {
    queryRemapper.push({
      'object.assign': {
        selectedGroupId: selectedGroupIdRemapper(selectedGroup, definition.selectedGroupId),
      },
    });
  }
  const resource = appDefinition.resources?.[resourceType];
  const method = 'PUT';
  const url = `${apiUrl}/api/apps/${appId}/resources/${resourceType}`;
  // @ts-expect-error Messed up
  const { id = 'id' } = resource;
  return request({
    ...args,
    definition: {
      ...definition,
      body: {
        'object.from': {
          prevResourcePosition: {
            prop: definition.order === 'desc' ? 'nextResourcePosition' : 'prevResourcePosition',
          },
          nextResourcePosition: {
            prop: definition.order === 'desc' ? 'prevResourcePosition' : 'nextResourcePosition',
          },
        },
      },
      method,
      query: queryRemapper,
      proxy: false,
      type: 'request',
      url: {
        'string.format': {
          template: `${url}${url.endsWith('/') ? '' : '/'}{id}/positions`,
          values: { id: definition.id ?? { prop: id as string } },
        },
      },
      schema: resource?.schema,
    },
  });
};

export const patch: ActionCreator<'resource.patch'> = (args) => {
  const { appDefinition, definition, getAppMemberSelectedGroup } = args;
  const resource = appDefinition.resources?.[definition.resource];
  const method = resource?.update?.method || 'PATCH';
  const url =
    resource?.update?.url ||
    resource?.url ||
    `${apiUrl}/api/apps/${appId}/resources/${definition.resource}`;
  // @ts-expect-error Messed up
  const { id = 'id' } = resource;

  const queryRemapper: Remapper = ([] as any[])
    .concat(definition?.query ?? resource?.patch?.query ?? null)
    .filter(Boolean);

  const selectedGroup = getAppMemberSelectedGroup?.();
  if (selectedGroup || definition.selectedGroupId) {
    queryRemapper.push({
      'object.assign': {
        selectedGroupId: selectedGroupIdRemapper(selectedGroup, definition.selectedGroupId),
      },
    });
  }

  return request({
    ...args,
    definition: {
      ...definition,
      query: queryRemapper.length ? queryRemapper : undefined,
      method,
      proxy: false,
      type: 'request',
      url: {
        'string.format': {
          template: `${url}${url.endsWith('/') ? '' : '/'}{id}`,
          values: { id: definition.id ?? { prop: id as string } },
        },
      },
      schema: resource?.schema,
    },
  });
};

export const remove: ActionCreator<'resource.delete'> = (args) => {
  const { appDefinition, definition, getAppMemberSelectedGroup } = args;
  const resource = appDefinition.resources?.[definition.resource];
  const method = resource?.delete?.method || 'DELETE';
  const url =
    resource?.delete?.url ||
    resource?.url ||
    `${apiUrl}/api/apps/${appId}/resources/${definition.resource}`;
  // @ts-expect-error Messed up
  const { id = 'id' } = resource;

  const queryRemapper: Remapper = ([] as any[])
    .concat(definition?.query ?? resource?.delete?.query ?? null)
    .filter(Boolean);

  const selectedGroup = getAppMemberSelectedGroup?.();
  if (selectedGroup || definition.selectedGroupId) {
    queryRemapper.push({
      'object.assign': {
        selectedGroupId: selectedGroupIdRemapper(selectedGroup, definition.selectedGroupId),
      },
    });
  }

  return request({
    ...args,
    definition: {
      ...definition,
      query: queryRemapper.length ? queryRemapper : undefined,
      method,
      proxy: false,
      type: 'request',
      url: {
        'string.format': {
          template: `${url}${url.endsWith('/') ? '' : '/'}{id}`,
          values: { id: { prop: id as string } },
        },
      },
      schema: resource?.schema,
    },
  });
};

export const removeAll: ActionCreator<'resource.delete.all'> = (args) => {
  const { appDefinition, definition, getAppMemberSelectedGroup } = args;
  const resource = appDefinition.resources?.[definition.resource];
  const method = resource?.delete?.method || 'DELETE';
  const url =
    resource?.delete?.url ||
    resource?.url ||
    `${apiUrl}/api/apps/${appId}/resources/${definition.resource}`;
  // @ts-expect-error Messed up
  const { id = 'id' } = resource;

  const queryRemapper: Remapper = [];
  const selectedGroup = getAppMemberSelectedGroup?.();
  if (selectedGroup || definition.selectedGroupId) {
    queryRemapper.push({
      'object.assign': {
        selectedGroupId: selectedGroupIdRemapper(selectedGroup, definition.selectedGroupId),
      },
    });
  }

  const [queryExistingResources] = query({
    ...args,
    definition: {
      ...definition,
      type: 'resource.query',
      query: queryRemapper.length ? queryRemapper : undefined,
    },
  });

  return [
    async (data: any) => {
      const existingResources = await queryExistingResources(data, {});
      const [dispatch] = request({
        ...args,
        definition: {
          ...definition,
          query: queryRemapper.length ? queryRemapper : undefined,
          method,
          proxy: false,
          type: 'request',
          url,
          schema: resource?.schema,
          body: {
            'array.from': (existingResources as []).map((r) => r[id]),
          },
        },
      });
      return dispatch(data, {});
    },
    { method, url },
  ];
};

export const removeBulk: ActionCreator<'resource.delete.bulk'> = (args) => {
  const { appDefinition, definition, getAppMemberSelectedGroup } = args;
  const resource = appDefinition.resources?.[definition.resource];
  const method = resource?.delete?.method || 'DELETE';
  const url =
    resource?.delete?.url ||
    resource?.url ||
    `${apiUrl}/api/apps/${appId}/resources/${definition.resource}`;

  const queryRemapper: Remapper = [];
  const selectedGroup = getAppMemberSelectedGroup?.();
  if (selectedGroup || definition.selectedGroupId) {
    queryRemapper.push({
      'object.assign': {
        selectedGroupId: selectedGroupIdRemapper(selectedGroup, definition.selectedGroupId),
      },
    });
  }

  return [
    (data) => {
      const [dispatch] = request({
        ...args,
        definition: {
          ...definition,
          query: queryRemapper.length ? queryRemapper : undefined,
          method,
          proxy: false,
          type: 'request',
          url,
          schema: resource?.schema,
          body: { root: null },
        },
      });
      return dispatch(data, {});
    },
    { method, url },
  ];
};

async function getSubscription(
  pushNotifications: ServiceWorkerRegistrationContextType,
): Promise<PushSubscription> {
  const { permission, requestPermission, subscribe: sub } = pushNotifications;
  let { subscription } = pushNotifications;

  if (!subscription && permission === 'default') {
    const newPermission = await requestPermission();
    if (newPermission !== 'granted') {
      throw new Error('Unable to subscribe. Permission was denied.');
    }

    subscription = await sub();
  } else if (permission === 'granted' && !subscription) {
    subscription = await sub();
  } else if (permission === 'denied') {
    throw new Error('Unable to subscribe. Permission was denied.');
  }

  return subscription;
}

export const subscribe: ActionCreator<'resource.subscription.subscribe'> = ({
  appDefinition,
  definition,
  pushNotifications,
}) => {
  const resource = appDefinition.resources?.[definition.resource];
  // @ts-expect-error Messed up
  const { id = 'id' } = resource;

  return [
    async (data: any) => {
      const { endpoint } = await getSubscription(pushNotifications);
      await axios.patch(`${apiUrl}/api/apps/${appId}/subscriptions`, {
        endpoint,
        resource: definition.resource,
        action: definition.action || 'update',
        value: true,
        resourceId: data?.[id],
      });

      return data;
    },
  ];
};

export const unsubscribe: ActionCreator<'resource.subscription.unsubscribe'> = ({
  appDefinition,
  definition,
  pushNotifications,
}) => {
  const resource = appDefinition.resources?.[definition.resource];
  // @ts-expect-error Messed up
  const { id = 'id' } = resource;

  return [
    async (data: any) => {
      const { endpoint } = await getSubscription(pushNotifications);
      await axios.patch(`${apiUrl}/api/apps/${appId}/subscriptions`, {
        endpoint,
        resource: definition.resource,
        action: definition.action || 'update',
        value: false,
        resourceId: data?.[id],
      });

      return data;
    },
  ];
};

export const toggle: ActionCreator<'resource.subscription.toggle'> = ({
  appDefinition,
  definition,
  pushNotifications,
}) => {
  const resource = appDefinition.resources?.[definition.resource];
  // @ts-expect-error Messed up
  const { id = 'id' } = resource;

  return [
    async (data: any) => {
      const { endpoint } = await getSubscription(pushNotifications);
      await axios.patch(`${apiUrl}/api/apps/${appId}/subscriptions`, {
        endpoint,
        resource: definition.resource,
        action: definition.action || 'update',
        resourceId: data?.[id],
      });

      return data;
    },
  ];
};

export const status: ActionCreator<'resource.subscription.status'> = ({
  appDefinition,
  definition,
  pushNotifications,
}) => {
  const resource = appDefinition.resources?.[definition.resource];
  // @ts-expect-error Messed up
  const { id = 'id' } = resource;

  return [
    async (d: any) => {
      const { endpoint } = await getSubscription(pushNotifications);
      const { data } = await axios.get(
        d?.[id]
          ? `${apiUrl}/api/apps/${appId}/resources/${definition.resource}/${d[id]}/subscriptions`
          : `${apiUrl}/api/apps/${appId}/resources/${definition.resource}/subscriptions`,
        {
          params: { endpoint },
        },
      );

      return data;
    },
  ];
};
