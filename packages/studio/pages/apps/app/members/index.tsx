import { Button, Table, useData, useMeta, useToggle } from '@appsemble/react-components';
import { type AppInvite, type AppMemberInfo } from '@appsemble/types';
import {
  checkOrganizationRoleOrganizationPermissions,
  convertToCsv,
  OrganizationPermission,
} from '@appsemble/utils';
import { downloadBlob } from '@appsemble/web-utils';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import { AddMembersModal } from './AddMembersModal/index.js';
import { MemberRow } from './MemberRow/index.js';
import { messages } from './messages.js';
import { AsyncDataView } from '../../../../components/AsyncDataView/index.js';
import { HeaderControl } from '../../../../components/HeaderControl/index.js';
import { useUser } from '../../../../components/UserProvider/index.js';
import { useApp } from '../index.js';

export function MembersPage(): ReactNode {
  useMeta(messages.title);

  const { app } = useApp();
  const { organizations } = useUser();
  const { formatMessage } = useIntl();

  const result = useData<AppMemberInfo[]>(`/api/apps/${app.id}/members`);

  const { data: invites, setData: setInvites } = useData<AppInvite[]>(
    `/api/apps/${app.id}/invites`,
  );

  const userOrganization = organizations?.find((org) => org.id === app?.OrganizationId);

  const addMembersModal = useToggle();

  const onInvited = useCallback(
    (newInvites: AppInvite[]) => {
      setInvites([...invites, ...newInvites]);
      addMembersModal.disable();
    },
    [addMembersModal, invites, setInvites],
  );

  const onMemberChange = (member: AppMemberInfo): void => {
    result.setData(result.data.map((m) => (m.sub === member.sub ? member : m)));
  };

  const onMemberExport = useCallback(() => {
    const csv = convertToCsv(result.data);
    downloadBlob(csv, 'members.csv');
  }, [result.data]);

  const mayInvite =
    userOrganization &&
    checkOrganizationRoleOrganizationPermissions(userOrganization.role, [
      OrganizationPermission.CreateAppInvites,
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
      {app.definition.security.default.policy === 'organization' && (
        <span>
          <FormattedMessage
            {...messages.inviteOrganization}
            values={{
              link: (text) => (
                <Link to={`../../../organizations/@${app.OrganizationId}`}>{text}</Link>
              ),
            }}
          />
        </span>
      )}
      <AsyncDataView
        emptyMessage={<FormattedMessage {...messages.noMembers} />}
        errorMessage={<FormattedMessage {...messages.memberError} />}
        loadingMessage={<FormattedMessage {...messages.loadingMembers} />}
        result={result}
      >
        {(members) => (
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
                  <th className="has-text-right">
                    <FormattedMessage {...messages.role} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <MemberRow key={member.sub} member={member} onChange={onMemberChange} />
                ))}
              </tbody>
            </Table>
          </>
        )}
      </AsyncDataView>
      <AddMembersModal onInvited={onInvited} state={addMembersModal} />
    </>
  );
}
