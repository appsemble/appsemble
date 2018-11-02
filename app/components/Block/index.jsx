import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { push } from '../../actions/message';
import Block from './Block';

function mapStateToProps(state, ownProps) {
  return {
    app: state.app.app,
    blockDef: state.blockDefs.blockDefs.find(blockDef => blockDef.id === ownProps.block.type),
  };
}

export default withRouter(
  connect(
    mapStateToProps,
    { showMessage: push },
  )(Block),
);
