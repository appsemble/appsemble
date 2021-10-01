import axios from 'axios';

import { ActionCreator } from '.';
import { apiUrl, appId } from '../settings';

export const register: ActionCreator<'user.register'> = ({
  definition,
  passwordLogin,
  remap,
  userInfo,
}) => [
  async (data) => {
    if (userInfo?.sub) {
      // User is already logged in, do nothing.
      return data;
    }

    const email = remap(definition.email, data);
    const password = remap(definition.email, data);
    const name = remap(definition.email, data);

    const response = await axios.post(`${apiUrl}/api/user/apps/${appId}/account`, {
      email,
      name,
      password,
    });
    await passwordLogin({ username: email, password });
    return response.data;
  },
];

export const login: ActionCreator<'user.login'> = ({
  definition,
  passwordLogin,
  remap,
  userInfo,
}) => [
  async (data) => {
    if (userInfo?.sub) {
      // User is already logged in, do nothing.
      return data;
    }

    const email = remap(definition.email, data);
    const password = remap(definition.email, data);

    await passwordLogin({ username: email, password });
    return data;
  },
];

export const update: ActionCreator<'user.update'> = ({
  definition,
  remap,
  setUserInfo,
  userInfo,
}) => [
  async (data) => {
    if (!userInfo?.sub) {
      // User is already logged in, do nothing.
      return data;
    }

    const email = remap(definition.email, data);
    const password = remap(definition.email, data);
    const name = remap(definition.email, data);
    const picture = remap(definition.picture, data);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);

    if (picture && picture instanceof File) {
      formData.append('picture', picture);
    }

    const { data: response } = await axios.patch<{
      email: string;
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
    });

    return data;
  },
];
