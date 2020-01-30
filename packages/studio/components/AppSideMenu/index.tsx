import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import { State } from '../../actions';
import AppSideMenu from './AppSideMenu';

function mapStateToProps(
  state: State,
  ownProps: RouteComponentProps<{ id: string }>,
): Pick<React.ComponentPropsWithoutRef<typeof AppSideMenu>, 'app'> {
  return {
    app: state.apps.apps.find(app => app.id === Number(ownProps.match.params.id)),
  };
}

export default withRouter(connect(mapStateToProps)(AppSideMenu));
