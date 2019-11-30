import { Loader } from '@appsemble/react-components';
import PropTypes from 'prop-types';
import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import AppDetails from '../AppDetails';
import AppSettings from '../AppSettings';
import AppSideMenu from '../AppSideMenu';
import CMS from '../CMS';
import Editor from '../Editor';
import Notifications from '../Notifications';
import ProtectedRoute from '../ProtectedRoute';
import styles from './AppContext.css';

/**
 * A wrapper which fetches the app definition and makes sure it is available to its children.
 */
export default class AppContext extends React.Component {
  static propTypes = {
    getApp: PropTypes.func.isRequired,
    initAuth: PropTypes.func.isRequired,
    match: PropTypes.shape().isRequired,
    ready: PropTypes.bool.isRequired,
  };

  async componentDidMount() {
    const { match, getApp, initAuth } = this.props;
    await initAuth();
    await getApp(match.params.id);
  }

  render() {
    const { ready, match } = this.props;

    if (!ready) {
      return <Loader />;
    }

    return (
      <div className={styles.container}>
        <AppSideMenu />
        <div className={styles.content}>
          <Switch>
            <Route component={AppDetails} exact path={match.path} />
            <ProtectedRoute component={Editor} exact path={`${match.path}/edit`} />
            <ProtectedRoute component={CMS} path={`${match.path}/resources`} />
            <ProtectedRoute component={AppSettings} exact path={`${match.path}/settings`} />
            <ProtectedRoute component={Notifications} exact path={`${match.path}/notifications`} />
            <Redirect to={match.path} />
          </Switch>
        </div>
      </div>
    );
  }
}
