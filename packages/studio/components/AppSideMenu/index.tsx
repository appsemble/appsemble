import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { State } from '../../actions';
import AppSideMenu from './AppSideMenu';

function mapStateToProps(
  state: State,
  ownProps: React.ComponentPropsWithoutRef<typeof AppSideMenu>,
): Partial<React.ComponentPropsWithoutRef<typeof AppSideMenu>> {
  return {
    app: state.apps.apps.find(app => app.id === Number(ownProps.match.params.id)),
  };
}

export default withRouter(connect(mapStateToProps)(AppSideMenu));
