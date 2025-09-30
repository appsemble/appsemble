import { Button } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import { messages } from './messages.js';

export function FailureBox(): ReactNode {
  return (
    <>
      <div className="title is-3">
        <FormattedMessage {...messages.purchaseFailed} />
      </div>
      <div className="column is-half">
        <div className="box">
          <FormattedMessage {...messages.purchaseError} />
        </div>
      </div>
      <div className="mt-5 column is-half is-flex is-justify-content-flex-end">
        <Button color="primary" component={Link} to="../invoices">
          <FormattedMessage {...messages.finish} />
        </Button>
      </div>
    </>
  );
}
