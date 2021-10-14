import { Table, Title, useData, useMeta } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import { useApp } from '..';
import { AsyncDataView } from '../../../../components/AsyncDataView';
import { MemberRow } from './MemberRow';
import { messages } from './messages';

export interface Member {
  id: string;
  name?: string;
  primaryEmail?: string;
  role: string;
  properties?: Record<string, string>;
}

export function RolesPage(): ReactElement {
  useMeta(messages.title);
  const { lang } = useParams<{ lang: string }>();
  const { app } = useApp();
  const result = useData<Member[]>(`/api/apps/${app.id}/members`);

  const onMemberChange = (member: Member): void => {
    result.setData(result.data.map((m) => (m.id === member.id ? member : m)));
  };

  return (
    <>
      <Title>
        <FormattedMessage {...messages.members} />
      </Title>
      {app.definition.security.default.policy === 'organization' && (
        <span>
          <FormattedMessage
            {...messages.inviteOrganization}
            values={{
              link: (text: string) => (
                <Link to={`/${lang}/organizations/@${app.OrganizationId}`}>{text}</Link>
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
                <MemberRow key={member.id} member={member} onChange={onMemberChange} />
              ))}
            </tbody>
          </Table>
        )}
      </AsyncDataView>
    </>
  );
}
