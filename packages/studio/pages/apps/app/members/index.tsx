import { Button, Table, useData, useMeta } from '@appsemble/react-components';
import { type AppMemberInfo } from '@appsemble/types';
import { convertToCsv, OrganizationPermission } from '@appsemble/utils';
import { downloadBlob } from '@appsemble/web-utils';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import { MemberRow } from './MemberRow/index.js';
import { messages } from './messages.js';
import { AsyncDataView } from '../../../../components/AsyncDataView/index.js';
import { HeaderControl } from '../../../../components/HeaderControl/index.js';
import { useUser } from '../../../../components/UserProvider/index.js';
import { useApp } from '../index.js';

export function MembersPage(): ReactNode {
  useMeta(messages.title);

  const { app } = useApp();
  const { userInfo } = useUser();

  const result = useData<AppMemberInfo[]>(`/api/apps/${app.id}/members`);

  const onMemberChange = (member: AppMemberInfo): void => {
    result.setData(result.data.map((m) => (m.sub === member.sub ? member : m)));
  };

  const onMemberExport = useCallback(() => {
    const csv = convertToCsv(result.data);
    downloadBlob(csv, 'members.csv');
  }, [result.data]);

  const {
    data: members,
    error: membersError,
    loading: membersLoading,
    setData: setMembers,
  } = useData<AppMemberInfo[]>(`/api/apps/${app.id}/members`);

  const me = members?.find((member) => member.id === userInfo.sub);
  const mayInvite = me && chec(me.role, [OrganizationPermission.CreateOrganizationInvites]);

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
                  <MemberRow key={member.memberId} member={member} onChange={onMemberChange} />
                ))}
              </tbody>
            </Table>
          </>
        )}
      </AsyncDataView>
    </>
  );
}
