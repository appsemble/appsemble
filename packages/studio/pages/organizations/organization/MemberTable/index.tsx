import { Button, Loader, Message, Table, useData, useToggle } from '@appsemble/react-components';
import { type OrganizationInvite, OrganizationPermission } from '@appsemble/types';
import { checkOrganizationRoleOrganizationPermissions } from '@appsemble/utils';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { HeaderControl } from '../../../../components/HeaderControl/index.js';
import { useUser } from '../../../../components/UserProvider/index.js';
import { type OrganizationMember } from '../../../../types.js';
import { AddMembersModal } from '../AddMembersModal/index.js';
import { InviteRow } from '../InviteRow/index.js';
import { MemberRow } from '../MemberRow/index.js';

export function MemberTable(): ReactNode {
  const { organizationId } = useParams<{ organizationId: string }>();
  const { userInfo } = useUser();
  const { formatMessage } = useIntl();

  const {
    data: members,
    error: membersError,
    loading: membersLoading,
    setData: setMembers,
  } = useData<OrganizationMember[]>(`/api/organizations/${organizationId}/members`);

  const {
    data: invites,
    loading: invitesLoading,
    setData: setInvites,
  } = useData<OrganizationInvite[]>(`/api/organizations/${organizationId}/invites`);

  const addMembersModal = useToggle();

  const onInvited = useCallback(
    (newInvites: OrganizationInvite[]) => {
      setInvites([...invites, ...newInvites]);
      addMembersModal.disable();
    },
    [addMembersModal, invites, setInvites],
  );

  const onMemberChanged = useCallback(
    (member: OrganizationMember) =>
      setMembers(members.map((m) => (m.id === member.id ? member : m))),
    [members, setMembers],
  );

  const onMemberDeleted = useCallback(
    (member: OrganizationMember) => setMembers(members.filter((m) => m.id !== member.id)),
    [members, setMembers],
  );

  const onInviteDeleted = useCallback(
    (invite: OrganizationInvite) => setInvites(invites.filter((i) => i.email !== invite.email)),
    [invites, setInvites],
  );

  const me = members?.find((member) => member.id === userInfo.sub);
  const ownerCount = me && members.filter((member) => member.role === 'Owner').length;

  const mayUpdateRoles =
    me &&
    checkOrganizationRoleOrganizationPermissions(me.role, [
      OrganizationPermission.UpdateOrganizationMemberRoles,
    ]);

  const mayDelete =
    me &&
    checkOrganizationRoleOrganizationPermissions(me.role, [
      OrganizationPermission.RemoveOrganizationMembers,
    ]);

  const mayInvite =
    me &&
    checkOrganizationRoleOrganizationPermissions(me.role, [
      OrganizationPermission.CreateOrganizationInvites,
    ]);

  return (
    <>
      <HeaderControl
        control={
          <Button
            disabled={!mayInvite}
            onClick={addMembersModal.enable}
            title={mayInvite ? undefined : formatMessage(messages.notAllowed)}
          >
            <FormattedMessage {...messages.addMembers} />
          </Button>
        }
        level={4}
      >
        <FormattedMessage {...messages.members} />
      </HeaderControl>
      {membersLoading || invitesLoading ? (
        <Loader />
      ) : membersError ? (
        <Message color="danger">
          <FormattedMessage {...messages.membersError} />
        </Message>
      ) : (
        <Table className={styles.table}>
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
              <MemberRow
                key={member.id}
                mayDelete={mayDelete}
                mayUpdateRoles={mayUpdateRoles}
                member={member}
                onChanged={onMemberChanged}
                onDeleted={onMemberDeleted}
                organizationId={organizationId}
                ownerCount={ownerCount}
              />
            ))}
            {invites?.map((invite) => (
              <InviteRow
                invite={invite}
                key={invite.email}
                mayInvite={mayInvite}
                onDeleted={onInviteDeleted}
              />
            ))}
          </tbody>
        </Table>
      )}
      <AddMembersModal onInvited={onInvited} state={addMembersModal} />
    </>
  );
}
