import { AppAccount } from '@appsemble/types';
import axios from 'axios';

import { apiUrl, appId } from '../settings.js';
import { ActionCreator } from './index.js';

export const register: ActionCreator<'user.register'> = ({
  definition,
  getUserInfo,
  passwordLogin,
  remap,
  route,
}) => [
  async (data) => {
    const userInfo = getUserInfo();
    if (userInfo?.sub) {
      // User is already logged in, do nothing.
      return data;
    }

    const email = remap(definition.email, data);
    const password = remap(definition.password, data);
    const name = remap(definition.displayName, data);
    const picture = remap(definition.picture, data);
    const properties = remap(definition.properties, data);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('locale', route.params.lang);

    if (name) {
      formData.append('name', name);
    }

    if (picture && picture instanceof File) {
      formData.append('picture', picture);
    }

    if (properties && typeof properties === 'object' && !Array.isArray(properties)) {
      formData.append(
        'properties',
        JSON.stringify(
          Object.fromEntries(
            Object.entries(properties).map(([key, value]) => [key, JSON.stringify(value)]),
          ),
        ),
      );
    }

    await axios.post(`${apiUrl}/api/user/apps/${appId}/account`, formData);
    await passwordLogin({ username: email, password });
    return data;
  },
];

export const login: ActionCreator<'user.login'> = ({
  definition,
  getUserInfo,
  passwordLogin,
  remap,
}) => [
  async (data) => {
    const userInfo = getUserInfo();
    if (userInfo?.sub) {
      // User is already logged in, do nothing.
      return data;
    }

    const email = remap(definition.email, data);
    const password = remap(definition.password, data);

    await passwordLogin({ username: email, password });
    return data;
  },
];

export const update: ActionCreator<'user.update'> = ({
  definition,
  getUserInfo,
  remap,
  route,
  setUserInfo,
}) => [
  async (data) => {
    const userInfo = getUserInfo();
    if (!userInfo?.sub) {
      // User is already logged in, do nothing.
      return data;
    }

    const email = remap(definition.email, data);
    const name = remap(definition.displayName, data);
    const picture = remap(definition.picture, data);
    const properties = remap(definition.properties, data);

    const formData = new FormData();
    if (name) {
      formData.append('name', name);
    }
    if (email) {
      formData.append('email', email);
    }
    if (picture && picture instanceof File) {
      formData.append('picture', picture);
    }
    if (properties && typeof properties === 'object' && !Array.isArray(properties)) {
      formData.append(
        'properties',
        JSON.stringify(
          Object.fromEntries(
            Object.entries(properties).map(([key, value]) => [key, JSON.stringify(value)]),
          ),
        ),
      );
    }

    formData.append('locale', route.params.lang);

    const { data: response } = await axios.patch<AppAccount>(
      `${apiUrl}/api/user/apps/${appId}/account`,
      formData,
    );
    setUserInfo({
      ...userInfo,
      email: response.email,
      sub: response.id,
      name: response.name,
      picture: response.picture,
      email_verified: response.emailVerified,
    });

    return data;
  },
];
