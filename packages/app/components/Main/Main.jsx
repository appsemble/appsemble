import { normalize } from '@appsemble/utils';
import PropTypes from 'prop-types';
import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import Page from '../Page';
import styles from './Main.css';

/**
 * The main body of the loaded app.
 *
 * This maps the page to a route and displays a page depending on URL.
 */
export default function Main({ app = null }) {
  if (app == null) {
    return null;
  }

  let defaultPath;
  const routes = app.pages.map(page => {
    const path = `/${[
      normalize(page.name),
      ...(page.parameters || []).map(parameter => `:${parameter}`),
      ...((page.subPages && [':subPage?']) || []),
    ].join('/')}`;

    if (page.name === app.defaultPage) {
      defaultPath = path;
    }
    return <Route key={path} exact path={path} render={props => <Page page={page} {...props} />} />;
  });

  return (
    <main className={styles.root}>
      <Switch>
        {routes}
        <Redirect to={defaultPath} />
      </Switch>
    </main>
  );
}

Main.propTypes = {
  // eslint-disable-next-line react/require-default-props
  app: PropTypes.shape(),
};
