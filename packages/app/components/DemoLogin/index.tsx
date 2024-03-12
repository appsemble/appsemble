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
import { type AppMember, type Team, type TeamMember } from '@appsemble/types';
import { TeamRole } from '@appsemble/utils';
import axios from 'axios';
import { type ChangeEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { apiUrl, appId } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { useDemoAppMembers } from '../DemoAppMembersProvider/index.js';
import { useUser } from '../UserProvider/index.js';

interface DemoLoginProps {
  readonly modal?: Toggle;
}

function TeamControls(): ReactNode {
  type TeamsResponse = (Partial<TeamMember> & Team)[];

  const { isLoggedIn, userInfo } = useUser();

  const sub = userInfo?.sub;

  const { formatMessage } = useIntl();

  const {
    data: teams,
    error,
    loading,
    refresh,
    setData: setTeams,
  } = useData<TeamsResponse>(`${apiUrl}/api/apps/${appId}/teams`);

  const changeTeamRole = useCallback(
    async (team: Team, role: TeamRole) => {
      await axios.put(`${apiUrl}/api/apps/${appId}/teams/${team.id}/members/${sub}`, {
        role,
      });
      setTeams((prevTeams) => prevTeams.map((t) => (t.id === team.id ? { ...t, role } : t)));
    },
    [sub, setTeams],
  );
  const leaveTeam = useCallback(
    async (team: Team) => {
      await axios.delete(`${apiUrl}/api/apps/${appId}/teams/${team.id}/members/${sub}`);
      setTeams((prevTeams) =>
        prevTeams.map((t) => (t.id === team.id ? { ...t, role: undefined } : t)),
      );
    },
    [sub, setTeams],
  );
  const joinTeam = useCallback(
    async (team: Team) => {
      const result = await axios.post(`${apiUrl}/api/apps/${appId}/teams/${team.id}/members`, {
        id: sub,
      });
      setTeams((prevTeams) => prevTeams.map((t) => (t.id === team.id ? result.data : t)));
    },
    [sub, setTeams],
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
        {teams?.map((team) => (
          <tr key={team.id}>
            <td>{team.name}</td>
            <td className="is-pulled-right">
              {team.role == null ? (
                <AsyncButton onClick={() => joinTeam(team)}>
                  <FormattedMessage {...messages.joinTeam} />
                </AsyncButton>
              ) : (
                <>
                  <AsyncSelect
                    name="role"
                    onChange={(event, value: TeamRole) => changeTeamRole(team, value)}
                    value={team.role}
                  >
                    {Object.values(TeamRole).map((role) => (
                      <option key={role} value={role}>
                        {formatMessage(messages[role])}
                      </option>
                    ))}
                  </AsyncSelect>
                  <AsyncButton onClick={() => leaveTeam(team)}>
                    <FormattedMessage {...messages.leaveTeam} />
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
  const { demoLogin } = useUser();
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
      demoAppMembers.find((appMember) => appMember.userId === event.target.value) ??
        demoAppMembers[0],
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
      appMemberId: demoAppMember?.userId ?? undefined,
      appRole: defaultAppRoleName ?? undefined,
    }),
    [defaultAppRoleName, demoAppMember?.userId],
  );

  const handleLogin = useCallback(async () => {
    busy.enable();
    try {
      await demoLogin({
        appMemberId: operation === 'login' ? demoAppMember.userId : '',
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
    demoAppMember?.userId,
    modal,
    operation,
    refetchDemoAppMembers,
    selectedAppRoleName,
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
              <option key={appMember.userId} value={appMember.userId}>
                {appMember.role} {appMember.name}
              </option>
            ))}
          </SimpleFormField>
          <SimpleSubmit allowPristine={false} disabled={busy.enabled} onClick={setLogin}>
            <FormattedMessage {...messages.login} />
          </SimpleSubmit>
        </div>
      ) : null}
      {appRoleNames.length ? (
        <>
          <SimpleFormField
            component={SelectField}
            disabled={appRoleNames.length < 2 || busy.enabled}
            help={<div className={styles.black}>{selectedAppRoleDescription}</div>}
            label={<FormattedMessage {...messages.selectRole} />}
            name="appRole"
            onChange={changeAppRole}
            required
          >
            {appRoleNames.map((appRoleName) => (
              <option key={appRoleName} value={appRoleName}>
                {appRoleName}
              </option>
            ))}
          </SimpleFormField>
          <SimpleSubmit allowPristine={false} disabled={busy.enabled} onClick={setCreateAccount}>
            <FormattedMessage {...messages.createAccount} />
          </SimpleSubmit>
        </>
      ) : null}
      <TeamControls />
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
