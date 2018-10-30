import { connect } from 'react-redux';

import { closeMenu } from '../../actions/menu';
import { logout } from '../../actions/user';
import SideNavigation from './SideNavigation';

function mapStateToProps(state) {
  return {
    app: state.app.app,
  };
}

export default connect(
  mapStateToProps,
  {
    closeMenu,
    logout,
  },
)(SideNavigation);
