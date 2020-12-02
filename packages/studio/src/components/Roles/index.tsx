import { Table, Title, useData, useMessages } from '@appsemble/react-components';
import axios from 'axios';
import classNames from 'classnames';
import React, { ChangeEvent, ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import { useApp } from '../AppContext';
import { AsyncDataView } from '../AsyncDataView';
import { HelmetIntl } from '../HelmetIntl';
import { useUser } from '../UserProvider';
import { messages } from './messages';

export interface Member {
  id: string;
  name?: string;
  primaryEmail?: string;
  role: string;
}

export function Roles(): ReactElement {
  const { formatMessage } = useIntl();
  const push = useMessages();
  const { lang } = useParams<{ lang: string }>();
  const { userInfo } = useUser();
  const { app } = useApp();
  const [submittingMemberRoleId, setSubmittingMemberRoleId] = useState<string>();
  const result = useData<Member[]>(`/api/apps/${app.id}/members`);

  const onChangeRole = useCallback(
    async (event: ChangeEvent<HTMLSelectElement>, userId: string): Promise<void> => {
      event.preventDefault();
      const { value: role } = event.currentTarget;

      setSubmittingMemberRoleId(userId);

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

      setSubmittingMemberRoleId(null);
    },
    [app, formatMessage, push],
  );

  return (
    <>
      <HelmetIntl title={messages.title} />
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
                      <div
                        className={classNames('select', {
                          'is-loading': submittingMemberRoleId === member.id,
                        })}
                      >
                        <select
                          defaultValue={member.role}
                          disabled={submittingMemberRoleId === member.id}
                          onChange={(event) => onChangeRole(event, member.id)}
                        >
                          {Object.keys(app.definition.security.roles).map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </div>
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
