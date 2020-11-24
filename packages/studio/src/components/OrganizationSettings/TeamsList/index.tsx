import {
  Button,
  Content,
  Modal,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  useData,
  useToggle,
} from '@appsemble/react-components';
import { Team } from '@appsemble/types';
import { Permission, TeamRole } from '@appsemble/utils';
import axios from 'axios';
import React, { ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams, useRouteMatch } from 'react-router-dom';

import { checkRole } from '../../../utils/checkRole';
import { AsyncDataView } from '../../AsyncDataView';
import { HeaderControl } from '../../HeaderControl';
import { ListButton } from '../../List/ListButton';
import { useUser } from '../../UserProvider';
import { messages } from './messages';

/**
 * The representation of a team that the user is a member of.
 */
export interface UserTeam extends Team {
  /**
   * The user’s role within the team.
   */
  role?: TeamRole;
}

const newTeam = {
  name: '',
};

/**
 * Render a list of teams.
 *
 * The rendered list items are links to the team settings page.
 */
export function TeamsList(): ReactElement {
  const { organizations, userInfo } = useUser();
  const { url } = useRouteMatch();
  const { organizationId } = useParams<{ organizationId: string }>();
  const modal = useToggle();
  const { formatMessage } = useIntl();
  const result = useData<UserTeam[]>(`/api/organizations/${organizationId}/teams`);
  const { setData: setTeams } = result;

  const submitTeam = useCallback(
    async ({ name }: Team) => {
      const { data } = await axios.post<Team>(`/api/organizations/${organizationId}/teams`, {
        name,
      });
      setTeams((teams) => [...teams, data]);
      modal.disable();
    },
    [modal, organizationId, setTeams],
  );

  const organization = organizations.find((o) => o.id === organizationId);
  const mayCreateTeam = organization && checkRole(organization.role, Permission.ManageMembers);

  return (
    <>
      <HeaderControl
        control={
          mayCreateTeam && (
            <Button onClick={modal.enable}>
              <FormattedMessage {...messages.createButton} />
            </Button>
          )
        }
        level={4}
      >
        <FormattedMessage {...messages.teams} />
      </HeaderControl>
      <Content fullwidth main padding>
        <AsyncDataView
          emptyMessage={<FormattedMessage {...messages.noTeams} />}
          errorMessage={<FormattedMessage {...messages.error} />}
          loadingMessage={<FormattedMessage {...messages.loading} />}
          result={result}
        >
          {(teams) => (
            <ul>
              {teams.map((team) => (
                <ListButton
                  alt={formatMessage(messages.logo)}
                  icon="users"
                  key={team.id}
                  subtitle={team?.role ? <FormattedMessage {...messages[team.role]} /> : ''}
                  title={team.name || team.id}
                  to={`${url}/${team.id}`}
                />
              ))}
            </ul>
          )}
        </AsyncDataView>
        <Modal
          component={SimpleForm}
          defaultValues={newTeam}
          footer={
            <SimpleModalFooter
              cancelLabel={<FormattedMessage {...messages.cancelLabel} />}
              onClose={modal.disable}
              submitLabel={<FormattedMessage {...messages.createButton} />}
            />
          }
          isActive={modal.enabled}
          onClose={modal.disable}
          onSubmit={submitTeam}
          resetOnSuccess
          title={<FormattedMessage {...messages.creatingNewTeam} />}
        >
          <SimpleFormField
            disabled={!userInfo.email_verified}
            icon="briefcase"
            label={<FormattedMessage {...messages.teamName} />}
            name="name"
            required
          />
        </Modal>
      </Content>
    </>
  );
}
