import { AsyncSelect, Button, useConfirmation } from '@appsemble/react-components';
import { GroupRole } from '@appsemble/utils';
import { type ChangeEvent, type ReactNode, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { messages } from './messages.js';
import { type GroupMember } from '../../../../../../types.js';

interface GroupMemberRowProps {
  readonly member: GroupMember;
  readonly mayInvite: boolean;
  readonly onEdit: (member: GroupMember, role: GroupRole) => Promise<void>;
  readonly onRemove: (member: GroupMember) => Promise<void>;
}

export function GroupMemberRow({
  mayInvite,
  member,
  onEdit,
  onRemove,
}: GroupMemberRowProps): ReactNode {
  const editRole = useCallback(
    (event: ChangeEvent, role: GroupRole) => onEdit(member, role),
    [member, onEdit],
  );
  const removeMember = useCallback(() => onRemove(member), [member, onRemove]);
  const { formatMessage } = useIntl();

  const remove = useConfirmation({
    title: <FormattedMessage {...messages.removingMember} />,
    body: <FormattedMessage {...messages.removeWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancelLabel} />,
    confirmLabel: <FormattedMessage {...messages.removeMember} />,
    action: removeMember,
  });

  return (
    <tr key={member.id}>
      <td>{member.name || member.primaryEmail || member.id}</td>
      <td align="right">
        {mayInvite ? (
          <AsyncSelect name="role" onChange={editRole} value={member.role}>
            {Object.values(GroupRole).map((role) => (
              <option key={role} value={role}>
                {formatMessage(messages[role])}
              </option>
            ))}
          </AsyncSelect>
        ) : (
          <FormattedMessage {...messages[member.role]} />
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
