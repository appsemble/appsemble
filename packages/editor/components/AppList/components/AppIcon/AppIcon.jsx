import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './AppIcon.css';
import messages from './messages';

export default class AppIcon extends React.Component {
  static propTypes = {
    app: PropTypes.shape().isRequired,
    intl: PropTypes.shape().isRequired,
  };

  render() {
    const { app, intl } = this.props;

    return (
      <a
        className={classNames('box', styles.appIcon)}
        href={`/${app.path}`}
        rel="noopener noreferrer"
        target="_blank"
      >
        <figure className={classNames('image', 'is-64x64', styles.image)}>
          <img alt={intl.formatMessage(messages.icon)} src={`/${app.id}/icon-64.png`} />
        </figure>
        <span>{app.name}</span>
      </a>
    );
  }
}
