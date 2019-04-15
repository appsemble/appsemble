import React from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import TitleBar from '../TitleBar';
import styles from './ErrorFallback.css';
import messages from './messages';

/**
 * Capture renderer errors using Sentry.
 */
export default class ErrorFallback extends React.Component {
  render() {
    return (
      <React.Fragment>
        <TitleBar>
          <FormattedMessage {...messages.title} />
        </TitleBar>
        <div className={classNames('container', styles.container)} role="alert">
          <FormattedMessage {...messages.message} />
        </div>
      </React.Fragment>
    );
  }
}
