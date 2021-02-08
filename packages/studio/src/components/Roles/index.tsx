import {
  AsyncSelect,
  Table,
  Title,
  useData,
  useMessages,
  useMeta,
} from '@appsemble/react-components';
import axios from 'axios';
import { ChangeEvent, ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import { useApp } from '../AppContext';
import { AsyncDataView } from '../AsyncDataView';
import { useUser } from '../UserProvider';
import { messages } from './messages';

export interface Member {
  id: string;
  name?: string;
  primaryEmail?: string;
  role: string;
}

export function Roles(): ReactElement {
  useMeta(messages.title);
  const { formatMessage } = useIntl();
  const push = useMessages();
  const { lang } = useParams<{ lang: string }>();
  const { userInfo } = useUser();
  const { app } = useApp();
  const result = useData<Member[]>(`/api/apps/${app.id}/members`);

  const onChangeRole = useCallback(
    async (event: ChangeEvent<HTMLSelectElement>, userId: string): Promise<void> => {
      event.preventDefault();
      const { value: role } = event.currentTarget;

      try {
        const { data: member } = await axios.post<Member>(`/api/apps/${app.id}/members/${userId}`, {
          role,
        });

        push({
          color: 'success',
          body: formatMessage(messages.changeRoleSuccess, {
            name: member.name || member.primaryEmail || member.id,
            role,
          }),
        });
      } catch {
        push({ body: formatMessage(messages.changeRoleError) });
      }
    },
    [app, formatMessage, push],
  );

  return (
    <>
      <Title>
        <FormattedMessage {...messages.members} />
      </Title>
      {app.definition.security.default.policy === 'organization' && (
        <FormattedMessage
          {...messages.inviteOrganization}
          values={{
            link: (text: string) => (
              <Link to={`/${lang}/settings/organizations/${app.OrganizationId}`}>{text}</Link>
            ),
          }}
        />
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
                <th className="has-text-right">
                  <FormattedMessage {...messages.role} />
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <span>{member.name || member.primaryEmail || member.id}</span>
                    <div className="tags is-inline ml-2">
                      {member.id === userInfo.sub && (
                        <span className="tag is-success">
                          <FormattedMessage {...messages.you} />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="has-text-right">
                    <div className="control is-inline">
                      <AsyncSelect onChange={(event) => onChangeRole(event, member.id)}>
                        {Object.keys(app.definition.security.roles).map((role) => (
                          <option key={role} selected={role === member.role} value={role}>
                            {role}
                          </option>
                        ))}
                      </AsyncSelect>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </AsyncDataView>
    </>
  );
}
