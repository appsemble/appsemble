import { AsyncSelect, Button, useConfirmation } from '@appsemble/react-components';
import { type AppRole, type GroupMember } from '@appsemble/types';
import { getAppRoles } from '@appsemble/utils';
import { type ChangeEvent, type ReactNode, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { messages } from './messages.js';
import { useApp } from '../../../index.js';

interface GroupMemberRowProps {
  readonly member: GroupMember;
  readonly mayUpdateRole: boolean;
  readonly mayRemove: boolean;
  readonly onEdit: (member: GroupMember, role: AppRole) => Promise<void>;
  readonly onRemove: (member: GroupMember) => Promise<void>;
}

export function GroupMemberRow({
  mayRemove,
  mayUpdateRole,
  member,
  onEdit,
  onRemove,
}: GroupMemberRowProps): ReactNode {
  const { formatMessage } = useIntl();

  const { app } = useApp();

  const editRole = useCallback(
    (event: ChangeEvent, role: AppRole) => onEdit(member, role),
    [member, onEdit],
  );

  const removeMember = useCallback(() => onRemove(member), [member, onRemove]);

  const remove = useConfirmation({
    title: <FormattedMessage {...messages.removingMember} />,
    body: <FormattedMessage {...messages.removeWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancelLabel} />,
    confirmLabel: <FormattedMessage {...messages.removeMember} />,
    action: removeMember,
  });

  const roleKeys = getAppRoles(app.definition.security);

  return (
    <tr key={member.id}>
      <td>{member.name || member.email || member.id}</td>
      <td align="right">
        {mayUpdateRole ? (
          <AsyncSelect name="role" onChange={editRole} value={member.role}>
            {roleKeys.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </AsyncSelect>
        ) : (
          <span>{member.role}</span>
        )}
        {mayRemove ? (
          <Button
            className="ml-2"
            color="danger"
            icon="trash-alt"
            onClick={remove}
            title={formatMessage(messages.removeMember)}
          />
        ) : null}
      </td>
    </tr>
  );
}
