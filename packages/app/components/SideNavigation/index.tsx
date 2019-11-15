import { ComponentProps } from 'react';
import { connect } from 'react-redux';

import { State } from '../../actions';
import { closeMenu } from '../../actions/menu';
import { logout } from '../../actions/user';
import SideNavigation from './SideNavigation';

function mapStateToProps(state: State): Partial<ComponentProps<typeof SideNavigation>> {
  return {
    definition: state.app.definition,
    user: state.user.user,
  };
}

export default connect(mapStateToProps, {
  closeMenu,
  logout,
})(SideNavigation);
