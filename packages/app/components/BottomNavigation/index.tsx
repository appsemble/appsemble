import { connect } from 'react-redux';

import { State } from '../../actions';
import BottomNavigation from './BottomNavigation';

function mapStateToProps(state: State): Partial<React.ComponentProps<typeof BottomNavigation>> {
  return {
    app: state.app.app,
  };
}

export default connect(mapStateToProps)(BottomNavigation);
