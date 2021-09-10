import { get, set } from 'idb-keyval';

import { ActionCreator } from '.';
import { appId } from '../settings';

export const read: ActionCreator<'storage.read'> = ({ definition, remap }) => [
  (data) => {
    const key = remap(definition.key, data);
    if (!key) {
      return;
    }

    return get(`app-${appId}-storage-${key}`);
  },
];

export const write: ActionCreator<'storage.write'> = ({ definition, remap }) => [
  async (data) => {
    const key = remap(definition.key, data);
    if (!key) {
      return data;
    }

    await set(`app-${appId}-storage-${key}`, remap(definition.value, data));
    return data;
  },
];
