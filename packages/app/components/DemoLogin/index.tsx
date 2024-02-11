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
import { type ReactNode, useCallback, useEffect, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { messages } from './messages.js';
import { apiUrl, appId } from '../../utils/settings.js';
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
  const { demoAppMembers, refetchDemoAppMembers } = useDemoAppMembers();

  const busy = useToggle();

  const defaultValues = useMemo(
    () => ({
      appMemberId: demoAppMembers[0]?.userId ?? undefined,
    }),
    [demoAppMembers],
  );

  const handleLogin = useCallback(
    async ({ appMemberId }: typeof defaultValues) => {
      busy.enable();
      try {
        await demoLogin(appMemberId ?? demoAppMembers[0]?.userId ?? '');
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
    [busy, demoLogin, demoAppMembers, modal, refetchDemoAppMembers],
  );

  const fields = (
    <>
      <SimpleFormError>{() => <FormattedMessage {...messages.loginFailed} />}</SimpleFormError>
      {demoAppMembers.length ? (
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
      ) : null}
      <TeamControls />
      <SimpleSubmit allowPristine={false} disabled={busy.enabled}>
        <FormattedMessage {...messages.login} />
      </SimpleSubmit>
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
