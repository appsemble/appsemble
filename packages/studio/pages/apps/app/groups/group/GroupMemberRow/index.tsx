import { AsyncSelect, Button, useConfirmation } from '@appsemble/react-components';
import { type GroupMember } from '@appsemble/types';
import { type AppRole, getAppRoles } from '@appsemble/utils';
import { type ChangeEvent, type ReactNode, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { messages } from './messages.js';
import { useApp } from '../../../index.js';

interface GroupMemberRowProps {
  readonly member: GroupMember;
  readonly mayInvite: boolean;
  readonly onEdit: (member: GroupMember, role: AppRole) => Promise<void>;
  readonly onRemove: (member: GroupMember) => Promise<void>;
}

export function GroupMemberRow({
  mayInvite,
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

  const roleKeys = getAppRoles(app);

  return (
    <tr key={member.id}>
      <td>{member.name || member.email || member.id}</td>
      <td align="right">
        {mayInvite ? (
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
        {mayInvite ? (
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
