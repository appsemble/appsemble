import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';

/**
 * The page presenting invoice information.
 */
export function InvoiceInformationPage(): ReactNode {
  return (
    <>
      <div className="title is-3">
        <FormattedMessage {...messages.title} />
      </div>
      <div className="column is-half">
        <div className="box">
          <FormattedMessage {...messages.invoiceInformation} />
        </div>
      </div>
    </>
  );
}
