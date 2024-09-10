import { type AppAccount, type AppMemberInfo } from '@appsemble/types';
import { timezone } from '@appsemble/web-utils';
import axios from 'axios';

import { type ActionCreator } from './index.js';
import { apiUrl, appId } from '../settings.js';

function assignProperties(properties: any, formData: FormData): void {
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
}

export const register: ActionCreator<'app.member.register'> = ({
  definition,
  getAppMemberInfo,
  params,
  passwordLogin,
  refetchDemoAppMembers,
  remap,
}) => [
  async (data) => {
    const appMemberInfo = getAppMemberInfo();

    if (appMemberInfo?.sub) {
      // App member is already logged in, do nothing.
      return data;
    }

    const email = remap(definition.email, data);
    const password = remap(definition.password, data);
    const name = remap(definition.name, data);
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

    assignProperties(properties, formData);

    await axios.post(`${apiUrl}/api/apps/${appId}/auth/email/register`, formData);

    if (login) {
      await passwordLogin({ username: email, password });
    }

    await refetchDemoAppMembers();
    return data;
  },
];

export const login: ActionCreator<'app.member.login'> = ({
  definition,
  getAppMemberInfo,
  passwordLogin,
  refetchDemoAppMembers,
  remap,
}) => [
  async (data) => {
    const appMemberInfo = getAppMemberInfo();

    if (appMemberInfo?.sub) {
      // App member is already logged in, do nothing.
      return data;
    }

    const email = remap(definition.email, data);
    const password = remap(definition.password, data);

    await passwordLogin({ username: email, password });
    await refetchDemoAppMembers();
    return data;
  },
];

export const logout: ActionCreator<'app.member.logout'> = ({ passwordLogout }) => [
  async () => {
    await passwordLogout();
  },
];

export const query: ActionCreator<'app.member.query'> = ({
  definition,
  getAppMemberInfo,
  remap,
}) => [
  async (data) => {
    const appMemberInfo = getAppMemberInfo();

    if (!appMemberInfo?.sub) {
      // App member is not logged in, do nothing.
      return data;
    }

    const roles = remap(definition.roles, data);

    const { data: response } = await axios.get<AppAccount[]>(
      `${apiUrl}/api/common/apps/${appId}/members/roles?roles=${roles}`,
    );

    return response;
  },
];

export const update: ActionCreator<'app.member.update'> = ({
  definition,
  getAppMemberInfo,
  refetchDemoAppMembers,
  remap,
  setAppMemberInfo,
}) => [
  async (data) => {
    const appMemberInfo = getAppMemberInfo();

    if (!appMemberInfo?.sub) {
      // App member is not logged in, do nothing.
      return data;
    }

    const id = remap(definition.id, data);
    const name = remap(definition.name, data);
    const properties = remap(definition.properties, data);
    const role = remap(definition.role, data);

    const formData = new FormData();

    if (name) {
      formData.append('name', name);
    }

    if (role) {
      formData.append('role', role);
    }

    assignProperties(properties, formData);

    let response;
    if (appMemberInfo.sub === id) {
      await axios.patch(`${apiUrl}/api/apps/${appId}/members/current`, formData);

      const { data: patchedAppMemberInfo } = await axios.get<AppMemberInfo>(
        `${apiUrl}/api/apps/${appId}/members/current`,
      );

      response = data;
      setAppMemberInfo(patchedAppMemberInfo);
    } else {
      await axios.patch<AppMemberInfo>(`${apiUrl}/api/apps/${appId}/members/${id}`, formData);
      await refetchDemoAppMembers();
    }

    return response;
  },
];

export const remove: ActionCreator<'app.member.remove'> = ({
  definition,
  getAppMemberInfo,
  refetchDemoAppMembers,
  remap,
}) => [
  async (data) => {
    const appMemberInfo = getAppMemberInfo();

    if (!appMemberInfo?.sub) {
      // App member is not logged in, do nothing.
      return data;
    }

    const id = remap(definition.id, data);

    const { data: response } = await axios.delete(`${apiUrl}/api/apps/${appId}/members/${id}`);

    await refetchDemoAppMembers();
    return response;
  },
];
