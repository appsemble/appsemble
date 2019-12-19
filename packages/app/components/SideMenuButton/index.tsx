import { ComponentProps } from 'react';
import { connect } from 'react-redux';

import { State } from '../../actions';
import { openMenu } from '../../actions/menu';
import SideMenuButton from './SideMenuButton';

function mapStateToProps(state: State): Partial<ComponentProps<typeof SideMenuButton>> {
  return {
    definition: state.app.definition,
    isOpen: state.menu.isOpen,
  };
}

export default connect(mapStateToProps, { openMenu })(SideMenuButton);
