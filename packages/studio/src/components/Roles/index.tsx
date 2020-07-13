import { Loader, Table, Title, useMessages } from '@appsemble/react-components';
import axios from 'axios';
import classNames from 'classnames';
import React, { ChangeEvent, ReactElement, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useApp } from '../AppContext';
import HelmetIntl from '../HelmetIntl';
import { useUser } from '../UserProvider';
import messages from './messages';

export interface Member {
  id: string;
  name?: string;
  primaryEmail?: string;
  role: string;
}

export default function Roles(): ReactElement {
  const { formatMessage } = useIntl();
  const push = useMessages();
  const { userInfo } = useUser();
  const { app } = useApp();
  const [members, setMembers] = useState<Member[]>();
  const [submittingMemberRoleId, setSubmittingMemberRoleId] = useState<string>();

  useEffect(() => {
    const getMembers = async (): Promise<void> => {
      const { data: appMembers } = await axios.get<Member[]>(`/api/apps/${app.id}/members`);
      if (app.definition.security.default.policy === 'invite') {
        setMembers(appMembers);
        return;
      }

      const { data: organizationMembers } = await axios.get<Member[]>(
        `/api/organizations/${app.OrganizationId}/members`,
      );

      setMembers([
        ...organizationMembers.map((orgMem) => {
          const appMember = appMembers.find((appMem) => appMem.id === orgMem.id);
          return appMember || { ...orgMem, role: app.definition.security.default.role };
        }),
        ...appMembers.filter(
          (appMem) => !organizationMembers.find((orgMem) => orgMem.id === appMem.id),
        ),
      ]);
    };
    getMembers();
  }, [app]);

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
      } catch (error) {
        push({ body: formatMessage(messages.changeRoleError) });
      }

      setSubmittingMemberRoleId(undefined);
    },
    [app, formatMessage, push],
  );

  if (members === undefined) {
    return <Loader />;
  }

  return (
    <>
      <HelmetIntl title={messages.title} />
      <Title>
        <FormattedMessage {...messages.members} />
      </Title>
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
    </>
  );
}
