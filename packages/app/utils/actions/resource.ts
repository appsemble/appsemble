import { type Remapper } from '@appsemble/types';
import axios from 'axios';

import { type ActionCreator } from './index.js';
import { request } from './request.js';
import { type ServiceWorkerRegistrationContextType } from '../../types.js';
import { apiUrl, appId } from '../settings.js';

export const historyGet: ActionCreator<'resource.history.get'> = (args) => {
  const { appDefinition, definition, getAppMemberSelectedGroup } = args;
  const resource = appDefinition.resources[definition.resource];
  const { id = 'id' } = resource;

  const selectedGroupId = getAppMemberSelectedGroup?.();
  return request({
    ...args,
    definition: {
      ...definition,
      query: selectedGroupId
        ? { 'object.assign': { selectedGroupId: selectedGroupId.id } }
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
      schema: resource.schema,
    },
  });
};

export const get: ActionCreator<'resource.get'> = (args) => {
  const { appDefinition, definition, getAppMemberSelectedGroup } = args;
  const { view } = definition;
  const resource = appDefinition.resources[definition.resource];
  const method = resource?.get?.method || 'GET';
  const url =
    resource?.get?.url ??
    resource?.url ??
    `${apiUrl}/api/apps/${appId}/resources/${definition.resource}`;
  const { id = 'id' } = resource;

  const query: Remapper = [].concat(definition?.query ?? resource?.query?.query).filter(Boolean);

  if (view) {
    query.push({ 'object.assign': { view } });
  }

  const selectedGroup = getAppMemberSelectedGroup?.();
  if (selectedGroup) {
    query.push({ 'object.assign': { selectedGroupId: selectedGroup.id } });
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
      schema: resource.schema,
    },
  });
};

export const query: ActionCreator<'resource.query'> = (args) => {
  const { appDefinition, definition, getAppMemberSelectedGroup } = args;
  const { own, view } = definition;
  const resource = appDefinition.resources[definition.resource];
  const method = resource?.query?.method || 'GET';
  const url =
    resource?.query?.url ??
    resource?.url ??
    `${apiUrl}/api/apps/${appId}/resources/${definition.resource}`;

  const queryRemapper: Remapper = []
    .concat(definition?.query ?? resource?.query?.query)
    .filter(Boolean);

  if (view) {
    queryRemapper.push({ 'object.assign': { view } });
  }

  if (own) {
    queryRemapper.push({ 'object.assign': { $own: own } });
  }

  const selectedGroup = getAppMemberSelectedGroup?.();
  if (selectedGroup) {
    queryRemapper.push({ 'object.assign': { selectedGroupId: selectedGroup.id } });
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
      schema: resource.schema,
    },
  });
};

export const count: ActionCreator<'resource.count'> = (args) => {
  const { appDefinition, definition, getAppMemberSelectedGroup } = args;
  const { own } = definition;
  const resource = appDefinition.resources[definition.resource];
  const method = resource?.count?.method || 'GET';
  const url =
    resource?.count?.url ??
    resource?.url ??
    `${apiUrl}/api/apps/${appId}/resources/${definition.resource}/$count`;

  const queryRemapper: Remapper = []
    .concat(definition?.query ?? resource?.count?.query)
    .filter(Boolean);

  if (own) {
    queryRemapper.push({ 'object.assign': { $own: own } });
  }

  const selectedGroup = getAppMemberSelectedGroup?.();
  if (selectedGroup) {
    queryRemapper.push({ 'object.assign': { selectedGroupId: selectedGroup.id } });
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
      schema: resource.schema,
    },
  });
};

export const create: ActionCreator<'resource.create'> = (args) => {
  const { appDefinition, definition, getAppMemberSelectedGroup } = args;
  const resource = appDefinition.resources[definition.resource];
  const method = resource?.create?.method || 'POST';
  const url =
    resource?.create?.url ||
    resource.url ||
    `${apiUrl}/api/apps/${appId}/resources/${definition.resource}`;

  const queryRemapper: Remapper = []
    .concat(definition?.query ?? resource?.create?.query)
    .filter(Boolean);

  const selectedGroup = getAppMemberSelectedGroup?.();
  if (selectedGroup) {
    queryRemapper.push({ 'object.assign': { selectedGroupId: selectedGroup.id } });
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
      schema: resource.schema,
    },
  });
  return [dispatch, { ...properties, type: 'resource.create' }];
};

export const update: ActionCreator<'resource.update'> = (args) => {
  const { appDefinition, definition, getAppMemberSelectedGroup } = args;
  const resource = appDefinition.resources[definition.resource];
  const method = resource?.update?.method || 'PUT';
  const url =
    resource?.update?.url ||
    resource.url ||
    `${apiUrl}/api/apps/${appId}/resources/${definition.resource}`;
  const { id = 'id' } = resource;

  const queryRemapper: Remapper = []
    .concat(definition?.query ?? resource?.update?.query)
    .filter(Boolean);

  const selectedGroup = getAppMemberSelectedGroup?.();
  if (selectedGroup) {
    queryRemapper.push({ 'object.assign': { selectedGroupId: selectedGroup.id } });
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
      schema: resource.schema,
    },
  });
};

export const patch: ActionCreator<'resource.patch'> = (args) => {
  const { appDefinition, definition, getAppMemberSelectedGroup } = args;
  const resource = appDefinition.resources[definition.resource];
  const method = resource?.update?.method || 'PATCH';
  const url =
    resource?.update?.url ||
    resource.url ||
    `${apiUrl}/api/apps/${appId}/resources/${definition.resource}`;
  const { id = 'id' } = resource;

  const queryRemapper: Remapper = []
    .concat(definition?.query ?? resource?.patch?.query)
    .filter(Boolean);

  const selectedGroup = getAppMemberSelectedGroup?.();
  if (selectedGroup) {
    queryRemapper.push({ 'object.assign': { selectedGroupId: selectedGroup.id } });
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
      schema: resource.schema,
    },
  });
};

export const remove: ActionCreator<'resource.delete'> = (args) => {
  const { appDefinition, definition, getAppMemberSelectedGroup } = args;
  const resource = appDefinition.resources[definition.resource];
  const method = resource?.delete?.method || 'DELETE';
  const url =
    resource?.delete?.url ||
    resource.url ||
    `${apiUrl}/api/apps/${appId}/resources/${definition.resource}`;
  const { id = 'id' } = resource;

  const queryRemapper: Remapper = []
    .concat(definition?.query ?? resource?.delete?.query)
    .filter(Boolean);

  const selectedGroup = getAppMemberSelectedGroup?.();
  if (selectedGroup) {
    queryRemapper.push({ 'object.assign': { selectedGroupId: selectedGroup.id } });
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
      schema: resource.schema,
    },
  });
};

export const removeAll: ActionCreator<'resource.delete.all'> = (args) => {
  const { appDefinition, definition, getAppMemberSelectedGroup } = args;
  const resource = appDefinition.resources[definition.resource];
  const method = resource?.delete?.method || 'DELETE';
  const url =
    resource?.delete?.url ||
    resource.url ||
    `${apiUrl}/api/apps/${appId}/resources/${definition.resource}`;
  const { id = 'id' } = resource;

  const queryRemapper: Remapper = [];
  const selectedGroup = getAppMemberSelectedGroup?.();
  if (selectedGroup) {
    queryRemapper.push({ 'object.assign': { selectedGroupId: selectedGroup.id } });
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
          schema: resource.schema,
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
  const resource = appDefinition.resources[definition.resource];
  const method = resource?.delete?.method || 'DELETE';
  const url =
    resource?.delete?.url ||
    resource.url ||
    `${apiUrl}/api/apps/${appId}/resources/${definition.resource}`;

  const queryRemapper: Remapper = [];
  const selectedGroup = getAppMemberSelectedGroup?.();
  if (selectedGroup) {
    queryRemapper.push({ 'object.assign': { selectedGroupId: selectedGroup.id } });
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
          schema: resource.schema,
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
  const resource = appDefinition.resources[definition.resource];
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
  const resource = appDefinition.resources[definition.resource];
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
  const resource = appDefinition.resources[definition.resource];
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
  const resource = appDefinition.resources[definition.resource];
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
