import { connect } from 'react-redux';

import { getBlockDefs } from '../../actions/blockDefs';
import Page from './Page';

function mapStateToProps(state, ownProps) {
  return {
    user: state.user.user,
    hasErrors: ownProps.page.blocks.some(block => state.blockDefs.errored.has(block.type)),
  };
}

export default connect(
  mapStateToProps,
  {
    getBlockDefs,
  },
)(Page);
