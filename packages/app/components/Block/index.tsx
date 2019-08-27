import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { State } from '../../actions';
import { push } from '../../actions/message';
import { blockToString } from '../../utils/blockUtils';
import Block from './Block';

function mapStateToProps(
  state: State,
  ownProps: Block['props'],
): Pick<Block['props'], 'app' | 'blockDef'> {
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
