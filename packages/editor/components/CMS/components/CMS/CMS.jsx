import React from 'react';
import { Route, Switch } from 'react-router-dom';
import PropTypes from 'prop-types';

import ResourceTable from '../ResourceTable';
import SideMenu from '../SideMenu';
import styles from './CMS.css';

export default class CMS extends React.Component {
  static propTypes = {
    app: PropTypes.shape().isRequired,
    match: PropTypes.shape().isRequired,
  };

  render() {
    const { app, match } = this.props;

    return (
      <div className={styles.cmsContainer}>
        <Route
          path={`${match.path}/:resourceName?`}
          render={props => <SideMenu app={app} {...props} />}
        />
        <div className={styles.cmsContent}>
          <Switch>
            <Route
              exact
              path={match.path}
              render={() => (
                <p>
                  this app has the following resources:
                  {Object.keys(app.resources).join(', ')}
                </p>
              )}
            />

            <Route
              component={ResourceTable}
              path={`${match.path}/:resourceName/:mode?/:resourceId?`}
            />
          </Switch>
        </div>
      </div>
    );
  }
}
