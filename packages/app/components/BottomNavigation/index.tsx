import { connect } from 'react-redux';

import { State } from '../../actions';
import BottomNavigation from './BottomNavigation';

function mapStateToProps(state: State): Partial<React.ComponentProps<typeof BottomNavigation>> {
  return {
    definition: state.app.definition,
  };
}

export default connect(mapStateToProps)(BottomNavigation);
