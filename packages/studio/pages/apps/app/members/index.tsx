import {
  Button,
  Loader,
  Message,
  Table,
  useData,
  useMeta,
  useToggle,
} from '@appsemble/react-components';
import { type AppInvite, type AppMemberInfo, OrganizationPermission } from '@appsemble/types';
import { checkOrganizationRoleOrganizationPermissions, convertToCsv } from '@appsemble/utils';
import { downloadBlob } from '@appsemble/web-utils';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { AddMembersModal } from './AddMembersModal/index.js';
import { InviteRow } from './InviteRow/index.js';
import { MemberRow } from './MemberRow/index.js';
import { messages } from './messages.js';
import { HeaderControl } from '../../../../components/HeaderControl/index.js';
import { useUser } from '../../../../components/UserProvider/index.js';
import { useApp } from '../index.js';

export function MembersPage(): ReactNode {
  useMeta(messages.title);

  const { app } = useApp();
  const { organizations } = useUser();
  const { formatMessage } = useIntl();

  const {
    data: members,
    error: membersError,
    loading: membersLoading,
    setData: setMembers,
  } = useData<AppMemberInfo[]>(`/api/apps/${app.id}/${app.demoMode ? 'demo-' : ''}members`);

  const {
    data: invites,
    loading: invitesLoading,
    setData: setInvites,
  } = useData<AppInvite[]>(`/api/apps/${app.id}/invites`);

  const userOrganization = organizations?.find((org) => org.id === app?.OrganizationId);

  const addMembersModal = useToggle();

  const onMemberChanged = useCallback(
    (member: AppMemberInfo) => setMembers(members.map((m) => (m.sub === member.sub ? member : m))),
    [members, setMembers],
  );

  const onMemberDeleted = useCallback(
    (member: AppMemberInfo) => setMembers(members.filter((m) => m.sub !== member.sub)),
    [members, setMembers],
  );

  const onAppInviteDeleted = useCallback(
    (invite: AppInvite) => setInvites(invites.filter((i) => i.email !== invite.email)),
    [invites, setInvites],
  );

  const onMemberExport = useCallback(() => {
    const csv = convertToCsv(members);
    downloadBlob(csv, 'members.csv');
  }, [members]);

  const onInvited = useCallback(
    (newInvites: AppInvite[]) => {
      setInvites([...invites, ...newInvites]);
      addMembersModal.disable();
    },
    [addMembersModal, invites, setInvites],
  );

  const mayUpdateRoles = checkOrganizationRoleOrganizationPermissions(userOrganization.role, [
    OrganizationPermission.UpdateAppMemberRoles,
  ]);

  const mayPatchProperties = checkOrganizationRoleOrganizationPermissions(userOrganization.role, [
    OrganizationPermission.PatchAppMemberProperties,
  ]);

  const mayDelete = checkOrganizationRoleOrganizationPermissions(userOrganization.role, [
    OrganizationPermission.DeleteAppMembers,
  ]);

  const mayInvite =
    userOrganization &&
    checkOrganizationRoleOrganizationPermissions(userOrganization.role, [
      OrganizationPermission.CreateAppInvites,
    ]);

  const mayDeleteInvites =
    userOrganization &&
    checkOrganizationRoleOrganizationPermissions(userOrganization.role, [
      OrganizationPermission.DeleteAppInvites,
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
        <>
          <div>
            <Button icon="download" onClick={onMemberExport}>
              <FormattedMessage {...messages.export} />
            </Button>
          </div>
          <Table>
            <thead>
              <tr>
                <th>
                  <FormattedMessage {...messages.member} />
                </th>
                <th>
                  <FormattedMessage {...messages.properties} />
                </th>
                <th>
                  <FormattedMessage {...messages.demo} />
                </th>
                <th className="has-text-right">
                  <FormattedMessage {...messages.role} />
                </th>
                <th align="right">
                  <FormattedMessage {...messages.actions} />
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <MemberRow
                  key={member.sub}
                  mayDelete={mayDelete}
                  mayPatchProperties={mayPatchProperties}
                  mayUpdateRoles={mayUpdateRoles}
                  member={member}
                  onChanged={onMemberChanged}
                  onDeleted={onMemberDeleted}
                />
              ))}
              {invites?.map((invite) => (
                <InviteRow
                  invite={invite}
                  key={invite.email}
                  mayDeleteInvites={mayDeleteInvites}
                  mayInvite={mayInvite}
                  onDelete={onAppInviteDeleted}
                />
              ))}
            </tbody>
          </Table>
        </>
      )}
      <AddMembersModal onInvited={onInvited} state={addMembersModal} />
    </>
  );
}
