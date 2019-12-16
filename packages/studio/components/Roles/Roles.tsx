import { Loader } from '@appsemble/react-components';
import { App, Message } from '@appsemble/types';
import axios from 'axios';
import classNames from 'classnames';
import React from 'react';
import { FormattedMessage, WrappedComponentProps } from 'react-intl';
import { RouteComponentProps } from 'react-router-dom';

import { User } from '../../types';
import HelmetIntl from '../HelmetIntl';
import messages from './messages';
import styles from './Roles.css';

export interface Member {
  id: number;
  name?: string;
  primaryEmail?: string;
  role: string;
}

export type RolesProps = {
  app: App;
  user: User;
  push: (message: Message) => void;
} & RouteComponentProps<{
  id: string;
}> &
  WrappedComponentProps;

export default function Roles({ app, push, intl, user }: RolesProps): React.ReactElement {
  const [members, setMembers] = React.useState<Member[]>(undefined);
  const [submittingMemberRoleId, setSubmittingMemberRoleId] = React.useState(0);

  React.useEffect(() => {
    const getMembers = async (): Promise<void> => {
      const { data: organizationMembers } = await axios.get<Member[]>(
        `/api/organizations/${app.OrganizationId}/members`,
      );
      const { data: appMembers } = await axios.get<Member[]>(`/api/apps/${app.id}/members`);

      setMembers([
        ...organizationMembers.map(orgMem => {
          const appMember = appMembers.find(appMem => appMem.id === orgMem.id);
          return appMember || { ...orgMem, role: app.definition.security.default.role };
        }),
        ...appMembers.filter(
          appMem => !organizationMembers.find(orgMem => orgMem.id === appMem.id),
        ),
      ]);
    };
    getMembers();
  }, [app.OrganizationId, app.definition.security.default.role, app.id]);

  const onChangeRole = async (
    event: React.ChangeEvent<HTMLSelectElement>,
    userId: number,
  ): Promise<void> => {
    event.preventDefault();
    const { value: role } = event.target;

    setSubmittingMemberRoleId(userId);

    try {
      const { data: member } = await axios.post<Member>(`/api/apps/${app.id}/members/${userId}`, {
        role,
      });

      setSubmittingMemberRoleId(0);

      push({
        color: 'success',
        body: intl.formatMessage(messages.changeRoleSuccess, {
          name: member.name || member.primaryEmail || member.id,
          role,
        }),
      });
    } catch (error) {
      push({ body: intl.formatMessage(messages.changeRoleError) });
      setSubmittingMemberRoleId(0);
    }
  };

  if (members === undefined) {
    return <Loader />;
  }

  return (
    <div className="content">
      <HelmetIntl title={messages.title} />
      <h3>
        <FormattedMessage {...messages.members} />
      </h3>
      <table className="table is-hoverable is-striped">
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
          {members.map(member => (
            <tr key={member.id}>
              <td>
                <span>{member.name || member.primaryEmail || member.id}</span>{' '}
                <div className={`tags ${styles.tags}`}>
                  {member.id === user.id && (
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
                      onChange={event => onChangeRole(event, member.id)}
                    >
                      {Object.keys(app.definition.security.roles).map(role => (
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
      </table>
    </div>
  );
}
