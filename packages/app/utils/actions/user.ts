import { type AppAccount } from '@appsemble/types';
import { timezone } from '@appsemble/web-utils';
import axios from 'axios';

import { type ActionCreator } from './index.js';
import { apiUrl, appId } from '../settings.js';

export const register: ActionCreator<'user.register'> = ({
  definition,
  getUserInfo,
  params,
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
    const name = remap(definition.displayName, data);
    const picture = remap(definition.picture, data);
    const properties = remap(definition.properties, data);
    const login = remap(definition.login, data) ?? true;

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('locale', params.lang);
    formData.append('timezone', timezone);

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
            Object.entries(properties).map(([key, value]) => [
              key,
              typeof value === 'string' ? value : JSON.stringify(value),
            ]),
          ),
        ),
      );
    }

    await axios.post(`${apiUrl}/api/user/apps/${appId}/account`, formData);
    if (login) {
      await passwordLogin({ username: email, password });
    }
    return data;
  },
];

export const create: ActionCreator<'user.create'> = ({
  definition,
  getUserInfo,
  params,
  remap,
}) => [
  async (data) => {
    const userInfo = getUserInfo();

    const email = remap(definition.email, data);

    if (userInfo?.sub && userInfo.email === email) {
      // User is already logged in, do nothing.
      return data;
    }

    const name = remap(definition.name, data);
    const password = remap(definition.password, data);
    const properties = remap(definition.properties, data);
    const role = remap(definition.role, data);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('locale', params.lang);
    formData.append('timezone', timezone);

    if (name) {
      formData.append('name', name);
    }

    if (role) {
      formData.append('role', role);
    }

    if (properties && typeof properties === 'object' && !Array.isArray(properties)) {
      formData.append(
        'properties',
        JSON.stringify(
          Object.fromEntries(
            Object.entries(properties).map(([key, value]) => [
              key,
              typeof value === 'string' ? value : JSON.stringify(value),
            ]),
          ),
        ),
      );
    }

    await axios.post(`${apiUrl}/api/user/apps/${appId}/accounts`, formData);
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

export const logout: ActionCreator<'user.logout'> = ({ passwordLogout }) => [
  async () => {
    await passwordLogout();
  },
];

export const query: ActionCreator<'user.query'> = ({ definition, getUserInfo, remap }) => [
  async (data) => {
    const userInfo = getUserInfo();
    if (!userInfo?.sub) {
      // User is not logged in, do nothing.
      return data;
    }

    const roles = remap(definition.roles, data);

    const { data: response } = await axios.get<AppAccount[]>(
      `${apiUrl}/api/user/apps/${appId}/accounts?roles=${roles}`,
    );

    return response;
  },
];

export const update: ActionCreator<'user.update'> = ({
  definition,
  getUserInfo,
  remap,
  setUserInfo,
}) => [
  async (data) => {
    const userInfo = getUserInfo();
    if (!userInfo?.sub) {
      // User is not logged in, do nothing.
      return data;
    }

    const name = remap(definition.name, data);
    const currentEmail = remap(definition.currentEmail, data) ?? userInfo.email;
    const newEmail = remap(definition.newEmail, data);
    const password = remap(definition.password, data);
    const properties = remap(definition.properties, data);
    const role = remap(definition.role, data);

    const formData = new FormData();
    if (name) {
      formData.append('name', name);
    }
    if (newEmail) {
      formData.append('email', newEmail);
    }
    if (role) {
      formData.append('role', role);
    }
    if (password) {
      formData.append('password', password);
    }

    if (properties && typeof properties === 'object' && !Array.isArray(properties)) {
      formData.append(
        'properties',
        JSON.stringify(
          Object.fromEntries(
            Object.entries(properties).map(([key, value]) => [
              key,
              typeof value === 'string' ? value : JSON.stringify(value),
            ]),
          ),
        ),
      );
    }

    const { data: response } = await axios.patch<AppAccount>(
      `${apiUrl}/api/user/apps/${appId}/accounts/${currentEmail}`,
      formData,
    );

    if (userInfo.email === currentEmail) {
      setUserInfo({
        ...userInfo,
        email: response.email,
        name: response.name,
        picture: response.picture,
        email_verified: response.emailVerified,
        properties: response.properties,
      });
    }

    return response;
  },
];

export const remove: ActionCreator<'user.remove'> = ({ definition, getUserInfo, remap }) => [
  async (data) => {
    const userInfo = getUserInfo();
    if (!userInfo?.sub) {
      // User is not logged in, do nothing.
      return data;
    }

    const email = remap(definition.email, data);

    const { data: response } = await axios.delete<AppAccount>(
      `${apiUrl}/api/user/apps/${appId}/accounts/${email}`,
    );

    return response;
  },
];
