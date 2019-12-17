import { connect } from 'react-redux';

import { State } from '../../actions';
import BlockList, { BlockListProps } from './BlockList';

function mapStateToProps(state: State): Partial<BlockListProps> {
  return {
    security: state.app.definition.security,
    role: state.user.role,
  };
}

export default connect(mapStateToProps)(BlockList);
