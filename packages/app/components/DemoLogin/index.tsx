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
import { type ReactElement, useCallback, useEffect, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { messages } from './messages.js';
import { apiUrl, appId } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useUser } from '../UserProvider/index.js';

interface DemoLoginProps {
  readonly modal?: Toggle;
}

function TeamControls(): ReactElement {
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

export function DemoLogin({ modal }: DemoLoginProps): ReactElement {
  const { definition } = useAppDefinition();
  const roles = Object.keys(definition?.security?.roles ?? {});
  const { demoLogin, role: userRole } = useUser();

  const busy = useToggle();

  const defaultValues = useMemo(
    () => ({
      role: userRole ?? roles[0] ?? '',
    }),
    [userRole, roles],
  );
  const handleLogin = useCallback(
    async ({ role }: typeof defaultValues) => {
      busy.enable();
      try {
        await demoLogin(role);
        busy.disable();
        if (modal) {
          modal.disable();
          window.location.reload();
        }
      } catch (error) {
        busy.disable();
        throw error;
      }
    },
    [busy, demoLogin, modal],
  );

  const fields = (
    <>
      <SimpleFormError>{() => <FormattedMessage {...messages.loginFailed} />}</SimpleFormError>
      <SimpleFormField
        component={SelectField}
        disabled={roles.length === 1 || busy.enabled}
        label={<FormattedMessage {...messages.selectRole} />}
        name="role"
        required
      >
        {roles.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </SimpleFormField>
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
