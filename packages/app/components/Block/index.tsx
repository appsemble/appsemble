import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { push } from '../../actions/message';
import { blockToString } from '../../utils/blockUtils';
import Block, { BlockProps } from './Block';

function mapStateToProps(state: any, ownProps: BlockProps): Partial<BlockProps> {
  return {
    app: state.app.app,
    blockDef: state.blockDefs.blockDefs[blockToString(ownProps.block)],
  };
}

export default withRouter(
  connect(
    mapStateToProps,
    { showMessage: push },
  )(Block),
);
