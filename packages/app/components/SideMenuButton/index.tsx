import { ComponentProps } from 'react';
import { connect } from 'react-redux';

import { State } from '../../actions';
import SideMenuButton from './SideMenuButton';

function mapStateToProps(state: State): Partial<ComponentProps<typeof SideMenuButton>> {
  return {
    definition: state.app.definition,
  };
}

export default connect(mapStateToProps)(SideMenuButton);
