import {
  AsyncButton,
  AsyncSelect,
  Loader,
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
import { type Team, type TeamMember } from '@appsemble/types';
import { TeamRole } from '@appsemble/utils';
import axios from 'axios';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { messages } from './messages.js';
import { apiUrl, appId } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
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
  const { demoAppMembers, refetchDemoAppMembers } = useDemoAppMembers();

  const busy = useToggle();

  const [operation, setOperation] = useState<'create-account' | 'login'>(
    demoAppMembers.length ? 'login' : 'create-account',
  );

  const setLogin = (): void => {
    setOperation('login');
  };

  const setCreateAccount = (): void => {
    setOperation('create-account');
  };

  const defaultAppRole = useMemo(() => definition?.security?.default.role || '', [definition]);

  const appRoles = useMemo<string[]>(
    () => Object.keys(definition?.security?.roles) || [],
    [definition],
  );

  const defaultValues = useMemo(
    () => ({
      appMemberId: demoAppMembers[0]?.userId ?? undefined,
      appRole: defaultAppRole ?? appRoles[0] ?? undefined,
    }),
    [appRoles, defaultAppRole, demoAppMembers],
  );

  const handleLogin = useCallback(
    async ({ appMemberId, appRole }: typeof defaultValues) => {
      busy.enable();
      try {
        await demoLogin({
          appMemberId: operation === 'login' ? appMemberId ?? demoAppMembers[0]?.userId ?? '' : '',
          appRole:
            operation === 'create-account' ? appRole ?? defaultAppRole ?? appRoles[0] ?? '' : '',
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
    },
    [
      appRoles,
      busy,
      defaultAppRole,
      demoAppMembers,
      demoLogin,
      modal,
      operation,
      refetchDemoAppMembers,
    ],
  );

  const fields = (
    <>
      <SimpleFormError>{() => <FormattedMessage {...messages.loginFailed} />}</SimpleFormError>
      {demoAppMembers.length ? (
        <div className="mb-6">
          <SimpleFormField
            component={SelectField}
            disabled={demoAppMembers.length < 2 || busy.enabled}
            label={<FormattedMessage {...messages.selectMember} />}
            name="appMemberId"
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
      {appRoles.length ? (
        <>
          <SimpleFormField
            component={SelectField}
            disabled={appRoles.length < 2 || busy.enabled}
            label={<FormattedMessage {...messages.selectRole} />}
            name="appRole"
            required
          >
            {appRoles.map((appRole) => (
              <option key={appRole} value={appRole}>
                {appRole}
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
