import { Loader } from '@appsemble/react-components';
import { Redirect, Route, Switch } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';

import Editor from '../Editor';
import CMS from '../CMS';
import SideMenu from '../SideMenu';
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
      <div className={`columns ${styles.container}`}>
        <div className="column is-2">
          <SideMenu />
        </div>
        <div className={`column ${styles.content}`}>
          <Switch>
            <Route component={Editor} exact path={`${match.path}/edit`} />
            <Route component={CMS} path={`${match.path}/resources`} />
            <Redirect to={match.path} />
          </Switch>
        </div>
      </div>
    );
  }
}
