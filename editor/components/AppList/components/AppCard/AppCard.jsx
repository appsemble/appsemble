import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';

export default class AppCard extends React.Component {
  static propTypes = {
    app: PropTypes.shape().isRequired,
  };

  render() {
    const { app } = this.props;

    return (
      <div className="card">
        <header className="card-header">
          <p className="card-header-title">{app.name}</p>
        </header>
        <div className="card-content">
          <div className="content has-text-centered is-centered">
            <figure className="image is-64x64">
              <img alt="Logo" className="content" src={`/${app.id}/icon-64.png`} />
            </figure>
          </div>
        </div>
        <footer className="card-footer">
          <a className="card-footer-item" href={`/${app.path}`}>
            View
          </a>
          <Link className="card-footer-item" to={`/editor/${app.id}`}>
            Edit
          </Link>
        </footer>
      </div>
    );
  }
}
