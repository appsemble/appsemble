import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import { State } from '../../actions';
import AppSideMenu, { AppSideMenuProps } from './AppSideMenu';

function mapStateToProps(
  state: State,
  ownProps: AppSideMenuProps & RouteComponentProps<{ id: string }>,
): Partial<AppSideMenuProps> {
  return {
    app: state.apps.apps.find(app => app.id === Number(ownProps.match.params.id)),
    user: state.user.user,
  };
}

export default withRouter(connect(mapStateToProps)(AppSideMenu));
