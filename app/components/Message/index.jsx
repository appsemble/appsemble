import { connect } from 'react-redux';

import { Message } from '@appsemble/react-components';
import { shift } from '../../actions/message';

function mapStateToProps(state) {
  return {
    message: state.message.queue[0],
  };
}

export default connect(
  mapStateToProps,
  { shift },
)(Message);
