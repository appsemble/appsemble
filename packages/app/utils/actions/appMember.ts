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
    const picture = remap(definition.picture ?? null, data);
    const properties = remap(definition.properties ?? null, data);
    const login = remap(definition.login ?? null, data) ?? true;

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    // @ts-expect-error 2769 No overload matches this call (strictNullChecks)
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
  getAppMemberSelectedGroup,
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

    const selectedGroupId = getAppMemberSelectedGroup()?.id;
    const url = selectedGroupId
      ? `${apiUrl}/api/apps/${appId}/invites?selectedGroupId=${selectedGroupId}`
      : `${apiUrl}/api/apps/${appId}/invites`;
    await axios.post(url, { email, role });

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
  getAppMemberSelectedGroup,
  remap,
}) => [
  async (data) => {
    const appMemberInfo = getAppMemberInfo();

    if (!appMemberInfo?.sub) {
      // App member is not logged in, do nothing.
      return data;
    }

    const roles = remap(definition.roles ?? null, data);
    const selectedGroupId = getAppMemberSelectedGroup()?.id;
    const url = `${apiUrl}/api/apps/${appId}/${appMemberInfo.demo ? 'demo-' : ''}members?roles=${roles || []}${selectedGroupId ? `&selectedGroupId=${selectedGroupId}` : ''}`;

    const { data: response } = await axios.get<AppMemberInfo[]>(url);

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

    const name = remap(definition.name ?? null, data);
    const properties = remap(definition.properties ?? null, data);
    const picture = remap(definition.picture ?? null, data);

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
  getAppMemberSelectedGroup,
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
    const selectedGroupId = getAppMemberSelectedGroup?.();

    const { data: response } = await axios.put<AppMemberInfo>(
      `${apiUrl}/api/apps/${appId}/app-members/${sub}/role${selectedGroupId ? `?selectedGroupId=${selectedGroupId}` : ''}`,
      { role },
    );

    await refetchDemoAppMembers();

    return response;
  },
];

export const appMemberPropertiesPatch: ActionCreator<'app.member.properties.patch'> = ({
  definition,
  getAppMemberInfo,
  getAppMemberSelectedGroup,
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
    const selectedGroupId = getAppMemberSelectedGroup()?.id;

    const { data: response } = await axios.patch<AppMemberInfo>(
      `${apiUrl}/api/apps/${appId}/app-members/${sub}/properties${selectedGroupId ? `?selectedGroupId=${selectedGroupId}` : ''}`,
      formData,
    );

    await refetchDemoAppMembers();

    return response;
  },
];

export const appMemberDelete: ActionCreator<'app.member.delete'> = ({
  definition,
  getAppMemberInfo,
  getAppMemberSelectedGroup,
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
    const selectedGroupId = getAppMemberSelectedGroup()?.id;

    const { data: response } = await axios.delete(
      `${apiUrl}/api/apps/${appId}/app-members/${sub}${selectedGroupId ? `?selectedGroupId=${selectedGroupId}` : ''}`,
    );

    await refetchDemoAppMembers();

    return response;
  },
];
