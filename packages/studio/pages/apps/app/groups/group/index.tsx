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
import {
  type AppInvite,
  type Group,
  type GroupInvite,
  type GroupMember,
  OrganizationPermission,
} from '@appsemble/types';
import { checkOrganizationRoleOrganizationPermissions } from '@appsemble/utils';
import axios from 'axios';
import { type ReactNode, useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { AddGroupMemberModal } from './AddGroupMemberModal/index.js';
import { GroupMemberRow } from './GroupMemberRow/index.js';
import { messages } from './messages.js';
import { AnnotationsTable } from '../../../../../components/AnnotationsTable/index.js';
import { AsyncDataView } from '../../../../../components/AsyncDataView/index.js';
import { HeaderControl } from '../../../../../components/HeaderControl/index.js';
import { useUser } from '../../../../../components/UserProvider/index.js';
import { useApp } from '../../index.js';

export function GroupPage(): ReactNode {
  const navigate = useNavigate();

  const { pathname } = useLocation();
  const { formatMessage } = useIntl();

  const { app } = useApp();
  const { organizations } = useUser();
  const { groupId } = useParams<{ groupId: string }>();

  const groupResult = useData<Group>(`/api/groups/${groupId}`);
  const memberResult = useData<GroupMember[]>(`/api/groups/${groupId}/members`);

  const { data: invites, setData: setInvites } = useData<GroupInvite[]>(
    `/api/groups/${groupId}/invites`,
  );

  useMeta(groupResult.data?.name || groupId);

  const editGroupModal = useToggle();
  const addMembersModal = useToggle();

  const onMemberInvited = useCallback(
    (newInvites: AppInvite[]) => {
      setInvites([...invites, ...newInvites]);
      addMembersModal.disable();
    },
    [addMembersModal, invites, setInvites],
  );

  const onEditMember = useCallback(
    async ({ id }: GroupMember, role: any) => {
      const { data: updated } = await axios.put<GroupMember>(`/api/group-members/${id}/role`, {
        role,
      });
      memberResult.setData((members) =>
        members.map((member) => (member.id === id ? updated : member)),
      );
    },
    [memberResult],
  );

  const onEditGroup = useCallback(
    async ({ annotations, name }: typeof defaultValues) => {
      const { data } = await axios.patch<Group>(`/api/groups/${groupId}`, {
        name,
        annotations: Object.fromEntries(annotations),
      });
      editGroupModal.disable();
      groupResult.setData(data);
    },
    [editGroupModal, groupResult, groupId],
  );

  const onDelete = useCallback(async () => {
    await axios.delete(`/api/groups/${groupId}`);
    navigate(pathname.replace(`/groups/${groupId}`, '/groups'), { replace: true });
  }, [navigate, groupId, pathname]);

  const onDeleteClick = useConfirmation({
    title: <FormattedMessage {...messages.deletingGroup} />,
    body: <FormattedMessage {...messages.deleteWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancelLabel} />,
    confirmLabel: <FormattedMessage {...messages.deleteGroup} />,
    action: onDelete,
  });

  const onRemoveGroupMember = useCallback(
    async ({ id }: GroupMember) => {
      await axios.delete(`/api/group-members/${id}`);
      memberResult.setData((members) => members.filter((member) => member.id !== id));
    },
    [memberResult],
  );

  const organization = organizations.find((o) => o.id === app.OrganizationId);

  const mayEditGroup =
    organization &&
    checkOrganizationRoleOrganizationPermissions(organization.role, [
      OrganizationPermission.UpdateGroups,
    ]);

  const mayInvite =
    organization &&
    checkOrganizationRoleOrganizationPermissions(organization.role, [
      OrganizationPermission.CreateGroupInvites,
    ]);

  const mayUpdateRole =
    organization &&
    checkOrganizationRoleOrganizationPermissions(organization.role, [
      OrganizationPermission.UpdateGroupMemberRoles,
    ]);

  const mayRemove =
    organization &&
    checkOrganizationRoleOrganizationPermissions(organization.role, [
      OrganizationPermission.RemoveGroupMembers,
    ]);

  const defaultValues = useMemo(
    () => ({
      name: groupResult?.data?.name,
      annotations: Object.entries(groupResult?.data?.annotations || {}),
    }),
    [groupResult?.data],
  );

  return (
    <AsyncDataView
      emptyMessage={<FormattedMessage {...messages.noGroup} />}
      errorMessage={<FormattedMessage {...messages.groupError} />}
      loadingMessage={<FormattedMessage {...messages.loadingGroup} />}
      result={groupResult}
    >
      {(group) => (
        <>
          <HeaderControl
            control={
              mayEditGroup ? (
                <div>
                  <Button onClick={editGroupModal.enable}>
                    <FormattedMessage {...messages.editButton} />
                  </Button>
                  <Button
                    className="ml-2"
                    color="danger"
                    icon="trash-alt"
                    onClick={onDeleteClick}
                    title={formatMessage(messages.deleteGroup)}
                  />
                </div>
              ) : null
            }
            level={4}
          >
            {group.name}
          </HeaderControl>
          <HeaderControl
            control={
              mayInvite ? (
                <Button onClick={addMembersModal.enable}>
                  <FormattedMessage {...messages.addMember} />
                </Button>
              ) : null
            }
            level={5}
          >
            <FormattedMessage {...messages.groupMembers} />
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
                    <GroupMemberRow
                      key={member.id}
                      mayRemove={mayRemove}
                      mayUpdateRole={mayUpdateRole}
                      member={member}
                      onEdit={onEditMember}
                      onRemove={onRemoveGroupMember}
                    />
                  ))}
                </tbody>
              </Table>
            )}
          </AsyncDataView>
          {mayEditGroup ? (
            <ModalCard
              component={SimpleForm}
              defaultValues={defaultValues}
              footer={
                <SimpleModalFooter
                  cancelLabel={<FormattedMessage {...messages.cancelLabel} />}
                  onClose={editGroupModal.disable}
                  submitLabel={<FormattedMessage {...messages.editButton} />}
                />
              }
              isActive={editGroupModal.enabled}
              onClose={editGroupModal.disable}
              onSubmit={onEditGroup}
              title={<FormattedMessage {...messages.editingGroup} />}
            >
              <SimpleFormField
                icon="briefcase"
                label={<FormattedMessage {...messages.groupName} />}
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
            <AddGroupMemberModal
              groupId={Number(groupId)}
              onInvited={onMemberInvited}
              state={addMembersModal}
            />
          ) : null}
        </>
      )}
    </AsyncDataView>
  );
}
