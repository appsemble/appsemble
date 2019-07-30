import * as React from 'react';
import { Redirect, Route, RouteComponentProps } from 'react-router-dom';

export interface ProtectedRouteProps extends RouteComponentProps {
  user: any;
}

export default class ProtectedRoute extends React.Component<ProtectedRouteProps> {
  render(): React.ReactNode {
    const { user, ...props } = this.props;

    if (!user) {
      return (
        <Redirect to={{ pathname: '/_/login', search: `?redirect=${props.location.pathname}` }} />
      );
    }

    return <Route {...props} />;
  }
}
