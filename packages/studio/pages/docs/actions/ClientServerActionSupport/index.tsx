import { type ActionName, type ServerActionName, serverActions } from '@appsemble/lang-sdk';
import { type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { messages } from './messages.js';

export function ClientServerActionSupport({ name }: { readonly name: ActionName }): ReactNode {
  const intl = useIntl();
  // As of the time of writing, all actions are supported on the client-side.
  return serverActions.has(name as ServerActionName) ? (
    <span className="tag is-primary m-1">
      <sup title={intl.formatMessage(messages.serverSideSupportTooltip)}>
        <FormattedMessage {...messages.serverSideSupport} />
      </sup>
    </span>
  ) : null;
}
