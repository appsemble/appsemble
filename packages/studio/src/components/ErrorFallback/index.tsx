import classNames from 'classnames';
import React, { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { HelmetIntl } from '../HelmetIntl';
import { Toolbar } from '../Toolbar';
import styles from './index.css';
import { messages } from './messages';

/**
 * Capture renderer errors using Sentry.
 */
export function ErrorFallback(): ReactElement {
  return (
    <>
      <HelmetIntl title={messages.title} />
      <Toolbar />
      <div className={classNames('container', styles.error)} role="alert">
        <FormattedMessage {...messages.message} />
      </div>
    </>
  );
}
