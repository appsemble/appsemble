import classNames from 'classnames';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './AppCard.css';
import messages from './messages';

export default class AppCard extends React.Component {
  static propTypes = {
    app: PropTypes.shape().isRequired,
    intl: PropTypes.shape().isRequired,
  };

  render() {
    const { app, intl } = this.props;

    return (
      <div className={classNames('card', styles.appCard)}>
        <header className="card-header">
          <p className="card-header-title">{app.name}</p>
        </header>
        <div className={classNames('card-content', styles.appCardContent)}>
          <div className="media">
            <figure className={classNames('image', 'is-64x64', styles.image)}>
              <img alt={intl.formatMessage(messages.icon)} src={`/${app.id}/icon-64.png`} />
            </figure>
          </div>
          {app.description && (
            <div className={classNames('content', styles.appDescription)}>{app.description}</div>
          )}
        </div>
        <footer className={classNames('card-footer', styles.appCardFooter)}>
          <a
            className="card-footer-item"
            href={`/${app.path}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <FormattedMessage {...messages.view} />
          </a>
          <Link className="card-footer-item" to={`/_/${app.id}/edit`}>
            <FormattedMessage {...messages.edit} />
          </Link>
        </footer>
      </div>
    );
  }
}
