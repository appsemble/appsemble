import { connect } from 'react-redux';

import { shift } from '../../actions/message';
import Message from './Message';

function mapStateToProps(state) {
  return {
    message: state.message.queue[0],
  };
}

export default connect(
  mapStateToProps,
  { shift },
)(Message);
