import {
  AsyncButton,
  AsyncSelect,
  Button,
  Loader,
  Modal,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  Table,
  useData,
  useToggle,
} from '@appsemble/react-components';
import { Team } from '@appsemble/types';
import { Permission, TeamRole } from '@appsemble/utils';
import axios from 'axios';
import React, { ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import { TeamMember } from '../../../types';
import { checkRole } from '../../../utils/checkRole';
import { HeaderControl } from '../../HeaderControl';
import { useUser } from '../../UserProvider';
import { messages } from './messages';

export function TeamSettings(): ReactElement {
  const { organizationId, teamId } = useParams<{ organizationId: string; teamId: string }>();
  const { organizations, userInfo } = useUser();
  const { formatMessage } = useIntl();

  const { data: team, loading, setData: setTeam } = useData<Team>(
    `/api/organizations/${organizationId}/teams/${teamId}`,
  );
  const { data: members, loading: membersLoading, setData: setMembers } = useData<TeamMember[]>(
    `/api/organizations/${organizationId}/teams/${teamId}/members`,
  );
  const modal = useToggle();

  const submitTeam = useCallback(
    async ({ name }: Team) => {
      const { data } = await axios.put<Team>(
        `/api/organizations/${organizationId}/teams/${teamId}`,
        {
          name,
        },
      );
      setTeam(data);
      modal.disable();
    },
    [modal, organizationId, setTeam, teamId],
  );

  const editRole = useCallback(
    async ({ id }: TeamMember, role: TeamRole) => {
      const { data: updated } = await axios.put<TeamMember>(
        `/api/organizations/${organizationId}/teams/${teamId}/members/${id}`,
        { role },
      );
      setMembers((mem) => mem.map((m) => (m.id === id ? updated : m)));
    },
    [organizationId, setMembers, teamId],
  );

  const removeMember = useCallback(
    async ({ id }: TeamMember) => {
      await axios.delete(`/api/organizations/${organizationId}/teams/${teamId}/members/${id}`);
      setMembers((mem) => mem.filter((m) => m.id !== id));
    },
    [organizationId, setMembers, teamId],
  );

  if (loading || membersLoading) {
    return <Loader />;
  }

  const organization = organizations.find((o) => o.id === organizationId);
  const me = members.find((member) => member.id === userInfo.sub);
  const mayEditTeam = organization && checkRole(organization.role, Permission.ManageMembers);
  const mayInvite =
    (me && me.role === TeamRole.Manager) ||
    (organization && checkRole(organization.role, Permission.InviteMember));

  return (
    <>
      {mayEditTeam && (
        <HeaderControl
          control={
            <Button onClick={modal.enable}>
              <FormattedMessage {...messages.editButton} />
            </Button>
          }
          level={4}
        >
          {team.name}
        </HeaderControl>
      )}

      <HeaderControl
        control={
          <Button onClick={modal.enable}>
            <FormattedMessage {...messages.addMember} />
          </Button>
        }
        level={5}
      >
        <FormattedMessage {...messages.teamMembers} />
      </HeaderControl>
      <Table>
        <thead>
          <tr>
            <th>
              <FormattedMessage {...messages.name} />
            </th>
            <th align="right">
              <FormattedMessage {...messages.actions} />
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td>{member.name || member.primaryEmail || member.id}</td>
              <td align="right">
                {mayInvite ? (
                  <AsyncSelect
                    name="role"
                    onChange={(event, role) => editRole(member, role as TeamRole)}
                    value={member.role}
                  >
                    {Object.values(TeamRole).map((role) => (
                      <option key={role} value={role}>
                        {formatMessage(messages[role])}
                      </option>
                    ))}
                  </AsyncSelect>
                ) : (
                  <FormattedMessage {...messages[member.role]} />
                )}
                {mayInvite && (
                  <AsyncButton
                    className="ml-2"
                    color="danger"
                    icon="trash-alt"
                    onClick={() => removeMember(member)}
                    title={formatMessage(messages.removeMember)}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {mayEditTeam && (
        <Modal
          component={SimpleForm}
          defaultValues={team}
          footer={
            <SimpleModalFooter
              cancelLabel={<FormattedMessage {...messages.cancelLabel} />}
              onClose={modal.disable}
              submitLabel={<FormattedMessage {...messages.editButton} />}
            />
          }
          isActive={modal.enabled}
          onClose={modal.disable}
          onSubmit={submitTeam}
          resetOnSuccess
          title={<FormattedMessage {...messages.editingTeam} />}
        >
          <SimpleFormField
            icon="briefcase"
            label={<FormattedMessage {...messages.teamName} />}
            name="name"
            required
          />
        </Modal>
      )}
    </>
  );
}
