import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

import SideMenu from './SideMenu';

function mapStateToProps(state, ownProps) {
  return {
    app: state.apps.apps.find(app => app.id === Number(ownProps.match.params.id)),
    user: state.user.user,
  };
}

export default withRouter(
  connect(
    mapStateToProps,
    {},
  )(SideMenu),
);
