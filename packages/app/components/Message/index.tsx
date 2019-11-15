import { Message } from '@appsemble/react-components';
import React from 'react';
import { connect } from 'react-redux';

import { State } from '../../actions';
import { remove } from '../../actions/message';

function mapStateToProps(state: State): Pick<React.ComponentProps<typeof Message>, 'messages'> {
  return {
    messages: state.message.queue,
  };
}

export default connect(mapStateToProps, { remove })(Message);
