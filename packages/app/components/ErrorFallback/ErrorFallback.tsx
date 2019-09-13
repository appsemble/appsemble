import classNames from 'classnames';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import TitleBar from '../TitleBar';
import styles from './ErrorFallback.css';
import messages from './messages';

/**
 * Capture renderer errors using Sentry.
 */
export default class ErrorFallback extends React.Component {
  render(): React.ReactNode {
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
}
