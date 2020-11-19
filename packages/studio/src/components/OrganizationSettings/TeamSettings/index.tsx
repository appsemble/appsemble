import {
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
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';

import { TeamMember } from '../../../types';
import { checkRole } from '../../../utils/checkRole';
import { AsyncDataView } from '../../AsyncDataView';
import { HeaderControl } from '../../HeaderControl';
import { useUser } from '../../UserProvider';
import { TeamMemberRow } from '../TeamMemberRow';
import { messages } from './messages';

export function TeamSettings(): ReactElement {
  const { organizationId, teamId } = useParams<{ organizationId: string; teamId: string }>();
  const { organizations, userInfo } = useUser();

  const { data: team, loading, setData: setTeam } = useData<Team>(
    `/api/organizations/${organizationId}/teams/${teamId}`,
  );
  const memberResult = useData<TeamMember[]>(
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

  const onEdit = useCallback(
    async ({ id }: TeamMember, role: TeamRole) => {
      const { data: updated } = await axios.put<TeamMember>(
        `/api/organizations/${organizationId}/teams/${teamId}/members/${id}`,
        { role },
      );
      memberResult.setData((members) =>
        members.map((member) => (member.id === id ? updated : member)),
      );
    },
    [organizationId, memberResult, teamId],
  );

  const onRemove = useCallback(
    async ({ id }: TeamMember) => {
      await axios.delete(`/api/organizations/${organizationId}/teams/${teamId}/members/${id}`);
      memberResult.setData((members) => members.filter((member) => member.id !== id));
    },
    [memberResult, organizationId, teamId],
  );

  if (loading || memberResult.loading) {
    return <Loader />;
  }

  const organization = organizations.find((o) => o.id === organizationId);
  const me = memberResult.data.find((member) => member.id === userInfo.sub);
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
      <AsyncDataView
        emptyMessage={<FormattedMessage {...messages.noMembers} />}
        errorMessage={<FormattedMessage {...messages.memberError} />}
        loadingMessage={<FormattedMessage {...messages.loadingMembers} />}
        result={memberResult}
      >
        {(members) => (
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
                <TeamMemberRow
                  key={member.id}
                  mayInvite={mayInvite}
                  member={member}
                  onEdit={onEdit}
                  onRemove={onRemove}
                />
              ))}
            </tbody>
          </Table>
        )}
      </AsyncDataView>
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
