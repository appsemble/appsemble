import {
  Button,
  ModalCard,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  Table,
  Title,
  useConfirmation,
  useData,
  useMeta,
  useToggle,
} from '@appsemble/react-components';
import { type Team } from '@appsemble/types';
import { Permission, TeamRole } from '@appsemble/utils';
import axios from 'axios';
import { type ReactNode, useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { AddTeamMemberModal } from './AddTeamMemberModal/index.js';
import { AnnotationsTable } from './AnnotationsTable/index.js';
import { messages } from './messages.js';
import { TeamMemberRow } from './TeamMemberRow/index.js';
import { AsyncDataView } from '../../../../../components/AsyncDataView/index.js';
import { HeaderControl } from '../../../../../components/HeaderControl/index.js';
import { useUser } from '../../../../../components/UserProvider/index.js';
import { type TeamMember } from '../../../../../types.js';
import { checkRole } from '../../../../../utils/checkRole.js';
import { useApp } from '../../index.js';

export function TeamPage(): ReactNode {
  const { teamId } = useParams<{ teamId: string }>();
  const { app } = useApp();
  const { organizations, userInfo } = useUser();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { formatMessage } = useIntl();

  const teamResult = useData<Team>(`/api/apps/${app.id}/teams/${teamId}`);
  useMeta(teamResult.data?.name || teamId);
  const memberResult = useData<TeamMember[]>(`/api/apps/${app.id}/teams/${teamId}/members`);
  const editModal = useToggle();
  const addModal = useToggle();

  const submitTeam = useCallback(
    async ({ annotations, name }: typeof defaultValues) => {
      const { data } = await axios.patch<Team>(`/api/apps/${app.id}/teams/${teamId}`, {
        name,
        annotations: Object.fromEntries(annotations),
      });
      editModal.disable();
      teamResult.setData(data);
    },
    [editModal, app, teamResult, teamId],
  );

  const onEdit = useCallback(
    async ({ id }: TeamMember, role: TeamRole) => {
      const { data: updated } = await axios.put<TeamMember>(
        `/api/apps/${app.id}/teams/${teamId}/members/${id}`,
        { role },
      );
      memberResult.setData((members) =>
        members.map((member) => (member.id === id ? updated : member)),
      );
    },
    [app, memberResult, teamId],
  );

  const onAdd = useCallback(
    async (id: string) => {
      const { data: newMember } = await axios.post<TeamMember>(
        `/api/apps/${app.id}/teams/${teamId}/members`,
        { id },
      );
      memberResult.setData((members) => [...members, newMember]);
      addModal.disable();
    },
    [addModal, memberResult, app, teamId],
  );

  const onDelete = useCallback(async () => {
    await axios.delete(`/api/apps/${app.id}/teams/${teamId}`);
    navigate(pathname.replace(`/teams/${teamId}`, '/teams'), { replace: true });
  }, [navigate, app, teamId, pathname]);

  const onDeleteClick = useConfirmation({
    title: <FormattedMessage {...messages.deletingTeam} />,
    body: <FormattedMessage {...messages.deleteWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancelLabel} />,
    confirmLabel: <FormattedMessage {...messages.deleteTeam} />,
    action: onDelete,
  });

  const onRemoveTeamMember = useCallback(
    async ({ id }: TeamMember) => {
      await axios.delete(`/api/apps/${app.id}/teams/${teamId}/members/${id}`);
      memberResult.setData((members) => members.filter((member) => member.id !== id));
    },
    [app, memberResult, teamId],
  );

  const organization = organizations.find((o) => o.id === app.OrganizationId);
  const me = memberResult.data?.find((member) => member.id === userInfo.sub);
  const mayEditTeam = organization && checkRole(organization.role, Permission.ManageTeams);
  const mayInvite = mayEditTeam || (me && me.role === TeamRole.Manager);

  const defaultValues = useMemo(
    () => ({
      name: teamResult?.data?.name,
      annotations: Object.entries(teamResult?.data?.annotations || {}),
    }),
    [teamResult?.data],
  );

  return (
    <AsyncDataView
      emptyMessage={<FormattedMessage {...messages.noTeam} />}
      errorMessage={<FormattedMessage {...messages.teamError} />}
      loadingMessage={<FormattedMessage {...messages.loadingTeam} />}
      result={teamResult}
    >
      {(team) => (
        <>
          <HeaderControl
            control={
              mayEditTeam ? (
                <div>
                  <Button onClick={editModal.enable}>
                    <FormattedMessage {...messages.editButton} />
                  </Button>
                  <Button
                    className="ml-2"
                    color="danger"
                    icon="trash-alt"
                    onClick={onDeleteClick}
                    title={formatMessage(messages.deleteTeam)}
                  />
                </div>
              ) : null
            }
            level={4}
          >
            {team.name}
          </HeaderControl>
          <HeaderControl
            control={
              mayInvite ? (
                <Button onClick={addModal.enable}>
                  <FormattedMessage {...messages.addMember} />
                </Button>
              ) : null
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
                      onRemove={onRemoveTeamMember}
                    />
                  ))}
                </tbody>
              </Table>
            )}
          </AsyncDataView>
          {mayEditTeam ? (
            <ModalCard
              component={SimpleForm}
              defaultValues={defaultValues}
              footer={
                <SimpleModalFooter
                  cancelLabel={<FormattedMessage {...messages.cancelLabel} />}
                  onClose={editModal.disable}
                  submitLabel={<FormattedMessage {...messages.editButton} />}
                />
              }
              isActive={editModal.enabled}
              onClose={editModal.disable}
              onSubmit={submitTeam}
              title={<FormattedMessage {...messages.editingTeam} />}
            >
              <SimpleFormField
                icon="briefcase"
                label={<FormattedMessage {...messages.teamName} />}
                name="name"
                required
              />
              <hr />
              <Title className="mb-0" level={5}>
                <FormattedMessage {...messages.annotations} />
              </Title>
              <SimpleFormField component={AnnotationsTable} name="annotations" />
            </ModalCard>
          ) : null}
          {mayInvite ? (
            <AddTeamMemberModal onAdd={onAdd} teamMembers={memberResult.data} toggle={addModal} />
          ) : null}
        </>
      )}
    </AsyncDataView>
  );
}
