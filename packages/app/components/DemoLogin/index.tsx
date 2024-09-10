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
import { type AppMember, type Group, type GroupMember } from '@appsemble/types';
import { type GroupMemberRole, groupMemberRoles } from '@appsemble/utils';
import axios from 'axios';
import { type ChangeEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

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
  type GroupsResponse = (Partial<GroupMember> & Group)[];

  const { appMemberInfo, isLoggedIn } = useAppMember();

  const sub = appMemberInfo?.sub;

  const { formatMessage } = useIntl();

  const {
    data: groups,
    error,
    loading,
    refresh,
    setData: setGroups,
  } = useData<GroupsResponse>(`${apiUrl}/api/apps/${appId}/groups`);

  const changeGroupRole = useCallback(
    async (group: Group, role: GroupMemberRole) => {
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
                    onChange={(event, value: GroupMemberRole) => changeGroupRole(group, value)}
                    value={group.role}
                  >
                    {Object.keys(groupMemberRoles).map((role: GroupMemberRole) => (
                      <option key={role} value={role}>
                        {formatMessage(messages[role])}
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
  const { definition } = useAppDefinition();
  const { getAppMessage } = useAppMessages();
  const { demoAppMembers, refetchDemoAppMembers } = useDemoAppMembers();

  const busy = useToggle();

  const appRoles = useMemo(() => definition?.security?.roles ?? {}, [definition]);
  const appRoleNames = useMemo(() => Object.keys(appRoles) ?? [], [appRoles]);
  const defaultAppRoleName = useMemo(
    () => definition?.security?.default.role ?? appRoleNames[0] ?? '',
    [appRoleNames, definition?.security?.default.role],
  );

  const [selectedDemoAppMember, setSelectedDemoAppMember] = useState<AppMember>(null);
  const [selectedAppRoleName, setSelectedAppRoleName] = useState<string>(defaultAppRoleName);

  const [operation, setOperation] = useState<'create-account' | 'login'>(
    demoAppMembers.length ? 'login' : 'create-account',
  );

  const demoAppMember = useMemo(
    () => selectedDemoAppMember ?? demoAppMembers[0],
    [demoAppMembers, selectedDemoAppMember],
  );

  const selectedDemoAppMemberRoleDescription = getAppMessage({
    id: `app.roles.${demoAppMember?.role}.description`,
    defaultMessage: appRoles[demoAppMember?.role]?.description,
  }).format() as string;

  const selectedAppRoleDescription = getAppMessage({
    id: `app.roles.${selectedAppRoleName}.description`,
    defaultMessage: appRoles[selectedAppRoleName]?.description,
  }).format() as string;

  const changeDemoAppMember = (event: ChangeEvent<MinimalHTMLElement>): void => {
    setSelectedDemoAppMember(
      demoAppMembers.find((appMember) => appMember.id === event.target.value) ?? demoAppMembers[0],
    );
  };

  const changeAppRole = (event: ChangeEvent<MinimalHTMLElement>): void => {
    setSelectedAppRoleName(event.target.value);
  };

  const setLogin = (): void => {
    setOperation('login');
  };

  const setCreateAccount = (): void => {
    setOperation('create-account');
  };

  const defaultValues = useMemo(
    () => ({
      appMemberId: demoAppMember?.id ?? undefined,
      appRole: defaultAppRoleName ?? undefined,
    }),
    [defaultAppRoleName, demoAppMember?.id],
  );

  const handleLogin = useCallback(async () => {
    busy.enable();
    try {
      await demoLogin({
        appMemberId: operation === 'login' ? demoAppMember.id : '',
        appRole: operation === 'create-account' ? selectedAppRoleName : '',
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
  }, [
    busy,
    demoLogin,
    operation,
    demoAppMember?.id,
    selectedAppRoleName,
    modal,
    refetchDemoAppMembers,
  ]);

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
              <option key={appMember.id} value={appMember.id}>
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
      {appRoleNames.length ? (
        <>
          <SimpleFormField
            component={SelectField}
            data-testid="app-role"
            disabled={appRoleNames.length < 2 || busy.enabled}
            help={<div className={styles.black}>{selectedAppRoleDescription}</div>}
            label={<FormattedMessage {...messages.selectRole} />}
            name="appRole"
            onChange={changeAppRole}
            required
          >
            {appRoleNames.map((appRoleName) => (
              <option key={appRoleName} value={appRoleName}>
                {getAppMessage({
                  id: `app.roles.${appRoleName}`,
                  defaultMessage: appRoleName,
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
