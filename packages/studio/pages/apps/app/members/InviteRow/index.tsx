import { type AppInvite } from '@appsemble/types';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';

interface InviteRowProps {
  /**
   * The invite represented by this row.
   */
  readonly invite: AppInvite;

  readonly mayInvite: boolean;
}

/**
 * A single row for managing an organization member from the members table.
 */
export function InviteRow({ invite, mayInvite }: InviteRowProps): ReactNode {
  return (
    <tr>
      <td>{invite.email}</td>
      <td align="right">{mayInvite || <FormattedMessage {...messages.invited} />}</td>
    </tr>
  );
}
