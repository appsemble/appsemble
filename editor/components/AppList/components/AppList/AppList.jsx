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
import React from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

import AppCard from '../AppCard';
import messages from './messages';
import styles from './applist.css';

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
      return (
        <p>
          <FormattedMessage {...messages.loading} />
        </p>
      );
    }

    if (!apps.length) {
      return (
        <p>
          <FormattedMessage {...messages.noApps} />
        </p>
      );
    }

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
        <div className={styles.appList}>
          {apps.map(app => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      </div>
    );
  }
}
