import {
  Button,
  Loader,
  Message,
  Select,
  Table,
  useData,
  useMeta,
  useToggle,
} from '@appsemble/react-components';
import { type AppInvite, type AppMemberInfo, OrganizationPermission } from '@appsemble/types';
import { checkOrganizationRoleOrganizationPermissions, convertToCsv } from '@appsemble/utils';
import { downloadBlob } from '@appsemble/web-utils';
import { type ReactNode, useCallback, useState } from 'react';
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

  const showTotp = app.totp !== 'disabled';
  const [totpFilter, setTotpFilter] = useState<'all' | 'disabled' | 'enabled'>('all');
  const shownMembers =
    totpFilter === 'all'
      ? members
      : members?.filter((member) => member.totpEnabled === (totpFilter === 'enabled'));

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

  const mayUpdateRoles = checkOrganizationRoleOrganizationPermissions(userOrganization.roles, [
    OrganizationPermission.UpdateAppMemberRoles,
  ]);

  const mayPatchProperties = checkOrganizationRoleOrganizationPermissions(userOrganization.roles, [
    OrganizationPermission.PatchAppMemberProperties,
  ]);

  const mayDelete = checkOrganizationRoleOrganizationPermissions(userOrganization.roles, [
    OrganizationPermission.DeleteAppMembers,
  ]);

  const mayResetTotp =
    showTotp &&
    checkOrganizationRoleOrganizationPermissions(userOrganization.roles, [
      OrganizationPermission.ResetAppMemberTotp,
    ]);

  const mayInvite =
    userOrganization &&
    checkOrganizationRoleOrganizationPermissions(userOrganization.roles, [
      OrganizationPermission.CreateAppInvites,
    ]);

  const mayDeleteInvites =
    userOrganization &&
    checkOrganizationRoleOrganizationPermissions(userOrganization.roles, [
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
          <div className="is-flex is-align-items-center">
            <Button icon="download" onClick={onMemberExport}>
              <FormattedMessage {...messages.export} />
            </Button>
            {showTotp ? (
              <Select
                aria-label={formatMessage(messages.totp)}
                className="ml-2"
                onChange={(event, value) => setTotpFilter(value as typeof totpFilter)}
                value={totpFilter}
              >
                <option value="all">{formatMessage(messages.totpFilterAll)}</option>
                <option value="enabled">{formatMessage(messages.totpFilterEnabled)}</option>
                <option value="disabled">{formatMessage(messages.totpFilterDisabled)}</option>
              </Select>
            ) : null}
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
                {showTotp ? (
                  <th>
                    <FormattedMessage {...messages.totp} />
                  </th>
                ) : null}
                <th className="has-text-right">
                  <FormattedMessage {...messages.role} />
                </th>
                <th align="right">
                  <FormattedMessage {...messages.actions} />
                </th>
              </tr>
            </thead>
            <tbody>
              {shownMembers.map((member) => (
                <MemberRow
                  key={member.sub}
                  mayDelete={mayDelete}
                  mayPatchProperties={mayPatchProperties}
                  mayResetTotp={mayResetTotp}
                  mayUpdateRoles={mayUpdateRoles}
                  member={member}
                  onChanged={onMemberChanged}
                  onDeleted={onMemberDeleted}
                  showTotp={showTotp}
                />
              ))}
              {invites?.map((invite) => (
                <InviteRow
                  invite={invite}
                  key={invite.email}
                  mayDeleteInvites={mayDeleteInvites}
                  mayInvite={mayInvite}
                  onDelete={onAppInviteDeleted}
                  showTotp={showTotp}
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
