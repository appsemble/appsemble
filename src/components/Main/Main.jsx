import PropTypes from 'prop-types';
import React from 'react';
import {
  Route,
  Switch,
} from 'react-router-dom';

import normalize from '../../utils/normalize';
import Page from '../Page';
import styles from './Main.css';


/**
 * The main body of the loaded app.
 *
 * This maps the page to a route and displays a page depending on URL.
 */
export default class Main extends React.Component {
  static propTypes = {
    app: PropTypes.shape(),
  };

  static defaultProps = {
    app: null,
  };

  render() {
    const {
      app,
    } = this.props;

    if (app == null) {
      return null;
    }

    return (
      <main className={styles.root}>
        <Switch>
          {app.pages.map(page => (
            <Route
              path={`/${normalize(page.name)}`}
              render={props => (
                <Page page={page} {...props} />
              )}
            />
          ))}
        </Switch>
      </main>
    );
  }
}
