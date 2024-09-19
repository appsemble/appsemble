import {
  AsyncButton,
  AsyncSelect,
  Loader,
  type MinimalHTMLElement,
  ModalCard,
  SelectField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
  Table,
  type Toggle,
  useData,
  useToggle,
} from '@appsemble/react-components';
import { type AppMemberInfo, type AppRole, type Group, type GroupMember } from '@appsemble/types';
import { getAppRoles } from '@appsemble/utils';
import axios from 'axios';
import { type ChangeEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { apiUrl, appId } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { useDemoAppMembers } from '../DemoAppMembersProvider/index.js';

interface DemoLoginProps {
  readonly modal?: Toggle;
}

function GroupControls(): ReactNode {
  type GroupsResponse = (Group & Partial<GroupMember>)[];

  const { appMemberInfo, isLoggedIn } = useAppMember();
  const { definition: appDefinition } = useAppDefinition();

  const sub = appMemberInfo?.sub;

  const {
    data: groups,
    error,
    loading,
    refresh,
    setData: setGroups,
  } = useData<GroupsResponse>(`${apiUrl}/api/apps/${appId}/demo-groups`);

  const changeGroupRole = useCallback(
    async (group: Group, role: AppRole) => {
      await axios.put(`${apiUrl}/api/apps/${appId}/groups/${group.id}/members/${sub}`, {
        role,
      });
      setGroups((prevGroups) => prevGroups.map((t) => (t.id === group.id ? { ...t, role } : t)));
    },
    [sub, setGroups],
  );

  const leaveGroup = useCallback(
    async (group: Group) => {
      await axios.delete(`${apiUrl}/api/apps/${appId}/groups/${group.id}/members/${sub}`);
      setGroups((prevGroups) =>
        prevGroups.map((t) => (t.id === group.id ? { ...t, role: undefined } : t)),
      );
    },
    [sub, setGroups],
  );

  const joinGroup = useCallback(
    async (group: Group) => {
      const result = await axios.post(`${apiUrl}/api/apps/${appId}/groups/${group.id}/members`, {
        id: sub,
      });
      setGroups((prevGroups) => prevGroups.map((t) => (t.id === group.id ? result.data : t)));
    },
    [sub, setGroups],
  );

  useEffect(() => {
    refresh();
  }, [isLoggedIn, refresh]);

  if (!isLoggedIn) {
    return null;
  }

  if (loading) {
    return <Loader />;
  }

  if (isLoggedIn && error) {
    return <FormattedMessage {...messages.error} />;
  }

  const appRoles = getAppRoles(appDefinition.security);

  return (
    <Table>
      <tbody>
        {groups?.map((group) => (
          <tr key={group.id}>
            <td>{group.name}</td>
            <td className="is-pulled-right">
              {group.role == null ? (
                <AsyncButton onClick={() => joinGroup(group)}>
                  <FormattedMessage {...messages.joinGroup} />
                </AsyncButton>
              ) : (
                <>
                  <AsyncSelect
                    name="role"
                    onChange={(event, value: AppRole) => changeGroupRole(group, value)}
                    value={group.role}
                  >
                    {appRoles.map((role: AppRole) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </AsyncSelect>
                  <AsyncButton onClick={() => leaveGroup(group)}>
                    <FormattedMessage {...messages.leaveGroup} />
                  </AsyncButton>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export function DemoLogin({ modal }: DemoLoginProps): ReactNode {
  const { demoLogin } = useAppMember();
  const { definition: appDefinition } = useAppDefinition();
  const { getAppMessage } = useAppMessages();
  const { demoAppMembers, refetchDemoAppMembers } = useDemoAppMembers();

  const busy = useToggle();

  const appRoles = getAppRoles(appDefinition.security);
  const defaultAppRole = useMemo(
    () => appDefinition?.security?.default.role ?? appRoles[0] ?? '',
    [appDefinition?.security?.default.role, appRoles],
  );

  const [selectedDemoAppMember, setSelectedDemoAppMember] = useState<AppMemberInfo>(null);
  const [selectedAppRole, setSelectedAppRole] = useState<string>(defaultAppRole);

  const [operation, setOperation] = useState<'create-account' | 'login'>(
    demoAppMembers.length ? 'login' : 'create-account',
  );

  const demoAppMember = useMemo(
    () => selectedDemoAppMember ?? demoAppMembers[0],
    [demoAppMembers, selectedDemoAppMember],
  );

  const getRoleDescription = (role: AppRole): string =>
    getAppMessage({
      id: `app.roles.${role}.description`,
      defaultMessage: appDefinition.security?.roles[role]?.description || role,
    }).format() as string;

  const selectedDemoAppMemberRoleDescription = getRoleDescription(demoAppMember?.role);

  const selectedAppRoleDescription = getRoleDescription(selectedAppRole);

  const changeDemoAppMember = (event: ChangeEvent<MinimalHTMLElement>): void => {
    setSelectedDemoAppMember(
      demoAppMembers.find((appMember) => appMember.sub === event.target.value) ?? demoAppMembers[0],
    );
  };

  const changeAppRole = (event: ChangeEvent<MinimalHTMLElement>): void => {
    setSelectedAppRole(event.target.value);
  };

  const setLogin = (): void => {
    setOperation('login');
  };

  const setCreateAccount = (): void => {
    setOperation('create-account');
  };

  const defaultValues = useMemo(
    () => ({
      appMemberId: demoAppMember?.sub ?? undefined,
      appRole: defaultAppRole ?? undefined,
    }),
    [defaultAppRole, demoAppMember?.sub],
  );

  const handleLogin = useCallback(async () => {
    busy.enable();
    try {
      await demoLogin({
        appMemberId: operation === 'login' ? demoAppMember.sub : '',
        appRole: operation === 'create-account' ? selectedAppRole : '',
      });
      busy.disable();
      if (modal) {
        modal.disable();
        window.location.reload();
      }
      await refetchDemoAppMembers();
    } catch (error) {
      busy.disable();
      throw error;
    }
  }, [busy, demoLogin, operation, demoAppMember, selectedAppRole, modal, refetchDemoAppMembers]);

  const fields = (
    <>
      <SimpleFormError>{() => <FormattedMessage {...messages.loginFailed} />}</SimpleFormError>
      {demoAppMembers.length ? (
        <div className="mb-6">
          <SimpleFormField
            component={SelectField}
            disabled={demoAppMembers.length < 2 || busy.enabled}
            help={<div className={styles.black}>{selectedDemoAppMemberRoleDescription}</div>}
            label={<FormattedMessage {...messages.selectMember} />}
            name="appMemberId"
            onChange={changeDemoAppMember}
            required
          >
            {demoAppMembers.map((appMember) => (
              <option key={appMember.sub} value={appMember.sub}>
                {appMember.name}
              </option>
            ))}
          </SimpleFormField>
          <SimpleSubmit
            allowPristine={false}
            dataTestId="login"
            disabled={busy.enabled}
            onClick={setLogin}
          >
            <FormattedMessage {...messages.login} />
          </SimpleSubmit>
        </div>
      ) : null}
      {appRoles.length ? (
        <>
          <SimpleFormField
            component={SelectField}
            data-testid="app-role"
            disabled={appRoles.length < 2 || busy.enabled}
            help={
              selectedAppRoleDescription === selectedAppRole ? null : (
                <div className={styles.black}>{selectedAppRoleDescription}</div>
              )
            }
            label={<FormattedMessage {...messages.selectRole} />}
            name="appRole"
            onChange={changeAppRole}
            required
          >
            {appRoles.map((appRole) => (
              <option key={appRole} value={appRole}>
                {getAppMessage({
                  id: `app.roles.${appRole}`,
                  defaultMessage: appRole,
                }).format()}
              </option>
            ))}
          </SimpleFormField>
          <SimpleSubmit
            allowPristine={false}
            dataTestId="create-account"
            disabled={busy.enabled}
            onClick={setCreateAccount}
          >
            <FormattedMessage {...messages.createAccount} />
          </SimpleSubmit>
        </>
      ) : null}
      <GroupControls />
    </>
  );

  if (modal) {
    return (
      <ModalCard
        component={SimpleForm}
        defaultValues={defaultValues}
        isActive={modal.enabled}
        onClose={modal.disable}
        onSubmit={handleLogin}
      >
        {fields}
      </ModalCard>
    );
  }

  return (
    <SimpleForm defaultValues={defaultValues} onSubmit={handleLogin}>
      {fields}
    </SimpleForm>
  );
}
