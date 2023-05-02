import { Button, Loader, Message, Table, useData, useToggle } from '@appsemble/react-components';
import { type OrganizationInvite } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import { type ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { HeaderControl } from '../../../../components/HeaderControl/index.js';
import { useUser } from '../../../../components/UserProvider/index.js';
import { type Member } from '../../../../types.js';
import { checkRole } from '../../../../utils/checkRole.js';
import { AddMembersModal } from '../AddMembersModal/index.js';
import { InviteRow } from '../InviteRow/index.js';
import { MemberRow } from '../MemberRow/index.js';

export function MemberTable(): ReactElement {
  const { organizationId } = useParams<{ organizationId: string }>();
  const { userInfo } = useUser();
  const { formatMessage } = useIntl();

  const {
    data: members,
    error: membersError,
    loading: membersLoading,
    setData: setMembers,
  } = useData<Member[]>(`/api/organizations/${organizationId}/members`);
  const {
    data: invites,
    loading: invitesLoading,
    setData: setInvites,
  } = useData<OrganizationInvite[]>(`/api/organizations/${organizationId}/invites`);
  const addMembersModal = useToggle();

  const onInvited = useCallback(
    (newInvites: OrganizationInvite[]) => setInvites([...invites, ...newInvites]),
    [invites, setInvites],
  );

  const onMemberChanged = useCallback(
    (member: Member) => setMembers(members.map((m) => (m.id === member.id ? member : m))),
    [members, setMembers],
  );

  const onMemberDeleted = useCallback(
    (member: Member) => setMembers(members.filter((m) => m.id !== member.id)),
    [members, setMembers],
  );

  const onInviteDeleted = useCallback(
    (invite: OrganizationInvite) => setInvites(invites.filter((i) => i.email !== invite.email)),
    [invites, setInvites],
  );

  const me = members?.find((member) => member.id === userInfo.sub);
  const ownerCount = me && members.filter((member) => member.role === 'Owner').length;
  const mayEdit = me && checkRole(me.role, Permission.ManageMembers);
  const mayEditRole = me && checkRole(me.role, Permission.ManageRoles);
  const mayInvite = me && checkRole(me.role, Permission.InviteMember);

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
                mayEdit={mayEdit}
                mayEditRole={mayEditRole}
                member={member}
                onChanged={onMemberChanged}
                onDeleted={onMemberDeleted}
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
