import { connect } from 'react-redux';

import { State } from '../../actions';
import Main from './Main';

function mapStateToProps(state: State): React.ComponentPropsWithoutRef<typeof Main> {
  return { definition: state.app.definition, user: state.user.user };
}

export default connect(mapStateToProps)(Main);
