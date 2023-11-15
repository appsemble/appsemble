import { AsyncSelect, Button, useConfirmation } from '@appsemble/react-components';
import { TeamRole } from '@appsemble/utils';
import { type ChangeEvent, type ReactNode, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { messages } from './messages.js';
import { type TeamMember } from '../../../../../../types.js';

interface TeamMemberRowProps {
  readonly member: TeamMember;
  readonly mayInvite: boolean;
  readonly onEdit: (member: TeamMember, role: TeamRole) => Promise<void>;
  readonly onRemove: (member: TeamMember) => Promise<void>;
}

export function TeamMemberRow({
  mayInvite,
  member,
  onEdit,
  onRemove,
}: TeamMemberRowProps): ReactNode {
  const editRole = useCallback(
    (event: ChangeEvent, role: TeamRole) => onEdit(member, role),
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
            {Object.values(TeamRole).map((role) => (
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
