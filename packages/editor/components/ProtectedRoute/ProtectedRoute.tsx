import * as React from 'react';
import { Redirect, Route, RouteComponentProps } from 'react-router-dom';

export interface ProtectedRouteProps extends RouteComponentProps {
  user: any;
}

export default class ProtectedRoute extends React.Component<ProtectedRouteProps> {
  render(): React.ReactNode {
    const { user, ...props } = this.props;

    if (!user) {
      const { location } = props;
      const search = new URLSearchParams();
      search.set('redirect', `${location.pathname}${location.search}${location.hash}`);
      return <Redirect to={{ pathname: '/_/login', search: `?${search}` }} />;
    }

    return <Route {...props} />;
  }
}
