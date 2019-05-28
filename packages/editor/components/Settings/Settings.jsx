import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';
import { Redirect, Route, Switch } from 'react-router-dom';

import styles from './Settings.css';
import messages from './messages';
import SideMenu from '../SideMenu';
import NavLink from '../NavLink';
import UserSettings from '../UserSettings';

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
            <span className="icon is-medium">
              <i className="fas fa-lg fa-user" />
            </span>
            <span className={classNames({ 'is-hidden': isCollapsed })}>
              <FormattedMessage {...messages.user} />
            </span>
          </NavLink>
        </SideMenu>
        <div className={styles.content}>
          <Switch>
            <Route component={UserSettings} exact path={`${match.path}/user`} />
            <Redirect to={`${match.path}/user`} />
          </Switch>
        </div>
      </div>
    );
  }
}
