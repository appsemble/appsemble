import { Loader } from '@appsemble/react-components';
import { AppDefinition, Authentication } from '@appsemble/types';
import React from 'react';
import { RouteComponentProps } from 'react-router-dom';

export interface AppContextProps {
  definition: AppDefinition;
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
    const { definition, initAuth } = this.props;
    let authentication;
    if (definition.authentication) {
      [authentication] = definition.authentication;
    }

    if (definition && definition !== prevProps.definition) {
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
