import { AsyncButton, useConfirmation, useMessages } from '@appsemble/react-components';
import { OrganizationInvite } from '@appsemble/types';
import axios from 'axios';
import { ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import { messages } from './messages.js';

interface InviteRowProps {
  /**
   * The invite represented by this row.
   */
  invite: OrganizationInvite;

  mayInvite: boolean;

  /**
   * This is called when the invite has been deleted.
   *
   * @param invite The invite that has been deleted.
   */
  onDeleted: (invite: OrganizationInvite) => void;
}

/**
 * A single row for managing an organization member from the members table.
 */
export function InviteRow({ invite, mayInvite, onDeleted }: InviteRowProps): ReactElement {
  const { formatMessage } = useIntl();
  const { organizationId } = useParams<{ organizationId: string }>();
  const push = useMessages();

  // Prevent spamming
  const [resent, setResent] = useState(false);

  const resendInvitation = useCallback(async () => {
    try {
      await axios.post(`/api/organizations/${organizationId}/invites/resend`, {
        email: invite.email,
      });
    } catch {
      push({ body: formatMessage(messages.resendError), color: 'danger' });
      return;
    }
    setResent(true);
    push({ body: formatMessage(messages.resendSuccess), color: 'info' });
  }, [formatMessage, push, invite, organizationId]);

  const deleteInvite = useConfirmation({
    title: <FormattedMessage {...messages.deleteInvite} />,
    body: <FormattedMessage {...messages.deleteConfirmationBody} />,
    cancelLabel: <FormattedMessage {...messages.cancelLabel} />,
    confirmLabel: <FormattedMessage {...messages.deleteInvite} />,
    async action() {
      await axios.delete(`/api/organizations/${organizationId}/invites`, {
        data: invite,
      });

      push({
        body: formatMessage(messages.deleteSuccess),
        color: 'info',
      });
      onDeleted(invite);
    },
  });

  return (
    <tr>
      <td>{invite.email}</td>
      <td align="right">
        {mayInvite ? (
          <AsyncButton className="mr-2" disabled={resent} onClick={resendInvitation}>
            <FormattedMessage {...messages.resend} />
          </AsyncButton>
        ) : null}
        {mayInvite ? (
          <AsyncButton
            color="danger"
            icon="trash-alt"
            onClick={deleteInvite}
            title={formatMessage(messages.deleteInvite)}
          />
        ) : null}
        {mayInvite || <FormattedMessage {...messages.invited} />}
      </td>
    </tr>
  );
}
