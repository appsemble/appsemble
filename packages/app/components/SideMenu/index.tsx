import { connect } from 'react-redux';

import { State } from '../../actions';
import { closeMenu } from '../../actions/menu';
import SideMenu from './SideMenu';

function mapStateToProps(state: State): Partial<React.ComponentPropsWithoutRef<typeof SideMenu>> {
  return {
    isOpen: state.menu.isOpen,
  };
}

export default connect(mapStateToProps, {
  closeMenu,
})(SideMenu);
