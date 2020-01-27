import { connect } from 'react-redux';

import { State } from '../../actions';
import Login from './Login';

function mapStateToProps(state: State): Partial<React.ComponentPropsWithoutRef<typeof Login>> {
  return {
    definition: state.app.definition,
  };
}

export default connect(mapStateToProps)(Login);
