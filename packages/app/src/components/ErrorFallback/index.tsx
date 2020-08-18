import classNames from 'classnames';
import React, { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { TitleBar } from '../TitleBar';
import styles from './index.css';
import { messages } from './messages';

/**
 * Capture renderer errors using Sentry.
 */
export function ErrorFallback(): ReactElement {
  return (
    <>
      <TitleBar>
        <FormattedMessage {...messages.title} />
      </TitleBar>
      <div className={classNames('container', styles.container)} role="alert">
        <FormattedMessage {...messages.message} />
      </div>
    </>
  );
}
