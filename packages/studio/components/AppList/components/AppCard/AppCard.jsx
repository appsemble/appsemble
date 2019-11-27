import { normalize } from '@appsemble/utils';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import Rating from '../../../Rating';
import styles from './AppCard.css';
import messages from './messages';

export default class AppCard extends React.Component {
  static propTypes = {
    app: PropTypes.shape().isRequired,
    intl: PropTypes.shape().isRequired,
    match: PropTypes.shape().isRequired,
  };

  render() {
    const { app, intl, match } = this.props;

    return (
      <div className={classNames('card', styles.appCard)}>
        <header className="card-header">
          <p className="card-header-title">{app.definition.name}</p>
        </header>
        <div className={classNames('card-content', styles.appCardContent)}>
          <div className="media">
            <figure className={classNames('image', 'is-64x64', styles.image)}>
              <img
                alt={intl.formatMessage(messages.icon)}
                src={`/@${app.OrganizationId}/${app.path || normalize(app.name)}/icon-64.png`}
              />
            </figure>
          </div>
          {app.definition.description && (
            <div className={classNames('content', styles.appDescription)}>
              {app.definition.description}
            </div>
          )}
          <Rating
            className={styles.rating}
            count={(app.rating && app.rating.count) || 0}
            value={(app.rating && app.rating.average) || 0}
          />
        </div>
        <footer className={classNames('card-footer', styles.appCardFooter)}>
          <a
            className="card-footer-item"
            href={
              app.domain
                ? `//${app.domain}${window.location.port && `:${window.location.port}`}`
                : `/@${app.OrganizationId}/${app.path}`
            }
            rel="noopener noreferrer"
            target="_blank"
          >
            <FormattedMessage {...messages.view} />
          </a>
          <Link className="card-footer-item" to={`${match.url}/${app.id}`}>
            <FormattedMessage {...messages.details} />
          </Link>
        </footer>
      </div>
    );
  }
}
