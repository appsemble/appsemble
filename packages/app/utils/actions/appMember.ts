import { type AppMemberInfo } from '@appsemble/types';
import { assignAppMemberProperties } from '@appsemble/utils';
import { timezone } from '@appsemble/web-utils';
import axios from 'axios';

import { type ActionCreator } from './index.js';
import { apiUrl, appId } from '../settings.js';

export const appMemberRegister: ActionCreator<'app.member.register'> = ({
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

    assignAppMemberProperties(properties, formData);

    await axios.post(`${apiUrl}/api/apps/${appId}/auth/email/register`, formData);

    if (login) {
      await passwordLogin({ username: email, password });
    }

    await refetchDemoAppMembers();
    return data;
  },
];

export const appMemberInvite: ActionCreator<'app.member.invite'> = ({
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

    const email = remap(definition.email, data);
    const role = remap(definition.role, data);

    await axios.post(`${apiUrl}/api/apps/${appId}/invites`, { email, role });

    return data;
  },
];

export const appMemberLogin: ActionCreator<'app.member.login'> = ({
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

export const appMemberLogout: ActionCreator<'app.member.logout'> = ({ passwordLogout }) => [
  async () => {
    await passwordLogout();
  },
];

export const appMemberQuery: ActionCreator<'app.member.query'> = ({
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

    const { data: response } = await axios.get<AppMemberInfo[]>(
      `${apiUrl}/api/apps/${appId}/${appMemberInfo.demo ? 'demo-' : ''}members?roles=${roles}`,
    );

    return response;
  },
];

export const appMemberCurrentPatch: ActionCreator<'app.member.current.patch'> = ({
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

    const name = remap(definition.name, data);
    const properties = remap(definition.properties, data);
    const picture = remap(definition.picture, data);

    const formData = new FormData();

    if (name) {
      formData.append('name', name);
    }

    if (picture && picture instanceof File) {
      formData.append('picture', picture);
    }

    assignAppMemberProperties(properties, formData);

    await axios.patch(`${apiUrl}/api/apps/${appId}/members/current`, formData);

    const { data: patchedAppMemberInfo } = await axios.get<AppMemberInfo>(
      `${apiUrl}/api/apps/${appId}/members/current`,
    );

    setAppMemberInfo(patchedAppMemberInfo);

    await refetchDemoAppMembers();

    return patchedAppMemberInfo;
  },
];

export const appMemberRoleUpdate: ActionCreator<'app.member.role.update'> = ({
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

    const sub = remap(definition.sub, data);
    const role = remap(definition.role, data);

    const { data: response } = await axios.put<AppMemberInfo>(
      `${apiUrl}/api/app-members/${sub}/role`,
      { role },
    );

    await refetchDemoAppMembers();

    return response;
  },
];

export const appMemberPropertiesPatch: ActionCreator<'app.member.properties.patch'> = ({
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

    const sub = remap(definition.sub, data);
    const properties = remap(definition.properties, data);

    const formData = new FormData();
    assignAppMemberProperties(properties, formData);

    const { data: response } = await axios.patch<AppMemberInfo>(
      `${apiUrl}/api/app-members/${sub}/properties`,
      formData,
    );

    await refetchDemoAppMembers();

    return response;
  },
];

export const appMemberDelete: ActionCreator<'app.member.delete'> = ({
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

    const sub = remap(definition.sub, data);

    const { data: response } = await axios.delete(`${apiUrl}/api/app-members/${sub}`);

    await refetchDemoAppMembers();

    return response;
  },
];
