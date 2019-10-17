import { Loader } from '@appsemble/react-components';
import { App, Authentication } from '@appsemble/types';
import React from 'react';
import { RouteComponentProps } from 'react-router-dom';

export interface AppContextProps {
  app: App;
  children: React.ReactChildren;
  getApp: () => void;
  initAuth: (authentication: Authentication) => void;
  ready: boolean;
}

/**
 * A wrapper which fetches the app definition and makes sure it is available to its children.
 */
export default class AppContext extends React.Component<AppContextProps & RouteComponentProps> {
  async componentDidMount(): Promise<void> {
    const { getApp } = this.props;

    await getApp();
  }

  async componentDidUpdate(prevProps: AppContextProps): Promise<void> {
    const { app, initAuth } = this.props;
    let authentication;
    if (app.definition.authentication) {
      [authentication] = app.definition.authentication;
    }

    if (app && app !== prevProps.app) {
      await initAuth(authentication);
    }
  }

  render(): React.ReactNode {
    const { children, location, ready } = this.props;

    if (!ready) {
      return <Loader />;
    }

    return React.Children.map(children, child =>
      React.cloneElement(child as React.ReactElement, {
        location,
      }),
    );
  }
}
