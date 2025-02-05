import { AsyncButton, useConfirmation, useMessages } from '@appsemble/react-components';
import { type GroupInvite } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import { messages } from './messages.js';

interface InviteRowProps {
  /**
   * The invite represented by this row.
   */
  readonly invite: GroupInvite;

  readonly mayInvite: boolean;

  readonly mayDeleteInvites: boolean;

  /**
   * This is called when the invite has been deleted.
   *
   * @param invite The invite that has been deleted.
   */
  readonly onDelete: (invite: GroupInvite) => void;
}

/**
 * A single row for managing an organization member from the members table.
 */
export function InviteRow({
  invite,
  mayDeleteInvites,
  mayInvite,
  onDelete,
}: InviteRowProps): ReactNode {
  const { formatMessage } = useIntl();
  const { groupId } = useParams<{ groupId: string }>();
  const push = useMessages();

  // Prevent spamming
  const [resent, setResent] = useState(false);

  const resendInvitation = useCallback(async () => {
    try {
      await axios.post(`/api/groups/${groupId}/invites/resend`, {
        email: invite.email,
      });
    } catch {
      push({ body: formatMessage(messages.resendError), color: 'danger' });
      return;
    }
    setResent(true);
    push({ body: formatMessage(messages.resendSuccess), color: 'info' });
  }, [formatMessage, push, invite, groupId]);

  const deleteInvite = useCallback(() => onDelete(invite), [invite, onDelete]);

  const confirmDelete = useConfirmation({
    title: <FormattedMessage {...messages.deleteInvite} />,
    body: <FormattedMessage {...messages.deleteConfirmationBody} />,
    cancelLabel: <FormattedMessage {...messages.cancelLabel} />,
    confirmLabel: <FormattedMessage {...messages.deleteInvite} />,
    action: deleteInvite,
  });

  return (
    <tr>
      <td>{invite.role}</td>
      <td>{invite.email}</td>
      <td align="right">
        {mayInvite ? (
          <AsyncButton className="mr-2" disabled={resent} onClick={resendInvitation}>
            <FormattedMessage {...messages.resend} />
          </AsyncButton>
        ) : null}
        {mayDeleteInvites ? (
          <AsyncButton
            color="danger"
            icon="trash-alt"
            onClick={confirmDelete}
            title={formatMessage(messages.deleteInvite)}
          />
        ) : null}
        {mayInvite || <FormattedMessage {...messages.invited} />}
      </td>
    </tr>
  );
}
