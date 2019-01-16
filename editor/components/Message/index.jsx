import { connect } from 'react-redux';
import { Message } from '@appsemble/react-components';

import { remove } from '../../actions/message';

function mapStateToProps(state) {
  return {
    messages: state.message.queue,
  };
}

export default connect(
  mapStateToProps,
  { remove },
)(Message);
