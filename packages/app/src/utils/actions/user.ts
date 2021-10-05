import axios from 'axios';

import { ActionCreator } from '.';
import { apiUrl, appId } from '../settings';

export const register: ActionCreator<'user.register'> = ({
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
    const name = remap(definition.displayName, data);
    const picture = remap(definition.picture, data);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    if (name) {
      formData.append('name', name);
    }

    if (picture && picture instanceof File) {
      formData.append('picture', picture);
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

    const { data: response } = await axios.patch<{
      email: string;
      email_verified: boolean;
      id: string;
      name: string;
      picture: string;
    }>(`${apiUrl}/api/user/apps/${appId}/account`, formData);
    setUserInfo({
      ...userInfo,
      email: response.email,
      sub: response.id,
      name: response.name,
      picture: response.picture,
      email_verified: response.email_verified,
    });

    return data;
  },
];
