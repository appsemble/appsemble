import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import HelmetIntl from '../HelmetIntl';
import styles from './CMSRoot.css';
import messages from './messages';

export default class CMSRoot extends React.Component {
  static propTypes = {
    app: PropTypes.shape().isRequired,
    match: PropTypes.shape().isRequired,
  };

  render() {
    const { app, match } = this.props;

    return (
      <>
        <HelmetIntl title={messages.title} titleValues={{ name: app.definition.name }} />
        {app.definition.resources ? (
          <div className="content">
            <p>
              <FormattedMessage {...messages.hasResources} />
            </p>
            <ul>
              {Object.keys(app.definition.resources)
                .sort()
                .map(resource => (
                  <li key={resource}>
                    <Link to={`${match.url}/${resource}`}>{resource}</Link>
                  </li>
                ))}
            </ul>
          </div>
        ) : (
          <div className={styles.noResources}>
            <span>
              <i className={`fas fa-folder-open ${styles.noResourcesIcon}`} />
            </span>
            <span>
              <FormattedMessage {...messages.noResources} />
            </span>
          </div>
        )}
      </>
    );
  }
}
