import classNames from 'classnames';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import HelmetIntl from '../HelmetIntl';
import Toolbar from '../Toolbar';
import styles from './ErrorFallback.css';
import messages from './messages';

/**
 * Capture renderer errors using Sentry.
 */
export default function ErrorFallback(): React.ReactElement {
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
