import { Loader } from '@appsemble/react-components';
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
import React from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

import AppCard from '../AppCard';
import CreateAppCard from '../CreateAppCard';
import messages from './messages';
import styles from './AppList.css';

export default class AppList extends React.Component {
  state = {
    openMenu: false,
  };

  async componentDidMount() {
    const { getApps } = this.props;
    getApps();
  }

  onLogout = () => {
    const { logout } = this.props;
    logout();
  };

  render() {
    const { apps, history } = this.props;
    const { openMenu } = this.state;

    if (!apps) {
      return <Loader />;
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
          <CreateAppCard history={history} />
        </div>
      </div>
    );
  }
}
