import { Icon } from '@appsemble/react-components';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect, Route, Switch } from 'react-router-dom';

import NavLink from '../NavLink';
import OrganizationsSettings from '../OrganizationsSettings';
import SideMenu from '../SideMenu';
import UserSettings from '../UserSettings';
import messages from './messages';
import styles from './Settings.css';

export default class Settings extends React.Component {
  static propTypes = {
    match: PropTypes.shape().isRequired,
  };

  state = { isCollapsed: false };

  render() {
    const { isCollapsed } = this.state;
    const { match } = this.props;

    return (
      <div className={styles.container}>
        <SideMenu
          isCollapsed={isCollapsed}
          toggleCollapse={() => this.setState({ isCollapsed: !isCollapsed })}
        >
          <NavLink className={styles.menuItem} exact to={`${match.url}/user`}>
            <Icon icon="user" size="medium" />
            <span className={classNames({ 'is-hidden': isCollapsed })}>
              <FormattedMessage {...messages.user} />
            </span>
          </NavLink>
          <NavLink className={styles.menuItem} exact to={`${match.url}/organizations`}>
            <Icon icon="briefcase" size="medium" />
            <span className={classNames({ 'is-hidden': isCollapsed })}>
              <FormattedMessage {...messages.organizations} />
            </span>
          </NavLink>
        </SideMenu>
        <div className={styles.content}>
          <Switch>
            <Route component={UserSettings} exact path={`${match.path}/user`} />
            <Route component={OrganizationsSettings} exact path={`${match.path}/organizations`} />
            <Redirect to={`${match.path}/user`} />
          </Switch>
        </div>
      </div>
    );
  }
}
