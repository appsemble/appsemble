import { connect } from 'react-redux';

import { State } from '../../actions';
import BlockList from './BlockList';

function mapStateToProps(state: State): Partial<React.ComponentPropsWithoutRef<typeof BlockList>> {
  return {
    security: state.app.definition.security,
    role: state.user.role,
  };
}

export default connect(mapStateToProps)(BlockList);
