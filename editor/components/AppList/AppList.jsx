import '@fortawesome/fontawesome-free/css/all.css';

import {
  Navbar,
  NavbarBrand,
  NavbarBurger,
  NavbarEnd,
  NavbarMenu,
  NavbarItem,
  Button,
  Icon,
} from '@appsemble/react-bulma';
import axios from 'axios';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import React from 'react';

import styles from './applist.css';
import messages from '../App/messages';

function chunkArray(items, size) {
  const results = [];

  while (items.length) {
    results.push(items.splice(0, size));
  }

  return results;
}

export default class AppList extends React.Component {
  state = {
    apps: [],
    openMenu: false,
  };

  async componentDidMount() {
    const { data: apps } = await axios.get(`/api/apps/`);

    this.setState({ apps });
  }

  onLogout = () => {
    const { logout } = this.props;
    logout();
  };

  render() {
    const { apps, openMenu } = this.state;
    if (!apps) {
      return <p>Loading...</p>;
    }

    if (!apps.length) {
      return <p>No apps!</p>;
    }

    const appTiles = apps.map(app => (
      <div key={`app-${app.id}`} className="tile is-parent is-4">
        <div className="card is-child tile">
          <header className="card-header">
            <p className="card-header-title">{app.name}</p>
          </header>
          <div className="card-content">
            <div className="content has-text-centered is-centered">
              <figure className="image is-64x64">
                <img alt="Logo" src={`/${app.id}/icon-64.png`} style={{ margin: '0 auto' }} />
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
      </div>
    ));

    const chunkTiles = chunkArray(appTiles, 3).map(chunk => (
      <div key={`chunk-${chunk[0].key}`} className="tile is-ancestor">
        {chunk}
      </div>
    ));

    return (
      <div>
        <Navbar className="is-dark">
          <NavbarBrand>
            <NavbarItem>
              <Link className={styles.navbarTitle} to="/editor">
                Appsemble
              </Link>
            </NavbarItem>
            <NavbarBurger
              active={openMenu}
              onClick={() => this.setState({ openMenu: !openMenu })}
            />
          </NavbarBrand>
          <NavbarMenu className={`${openMenu && 'is-active'}`}>
            <NavbarEnd>
              <NavbarItem>
                <Button onClick={this.onLogout}>
                  <Icon fa="sign-out-alt" />
                  <span>
                    <FormattedMessage {...messages.logoutButton} />
                  </span>
                </Button>
              </NavbarItem>
            </NavbarEnd>
          </NavbarMenu>
        </Navbar>
        <div className={styles.appTiles}>{chunkTiles}</div>
      </div>
    );
  }
}
