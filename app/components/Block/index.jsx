import {
  connect,
} from 'react-redux';
import {
  withRouter,
} from 'react-router-dom';

import Block from './Block';


function mapStateToProps(state, ownProps) {
  return {
    blockDef: state.blockDefs.blockDefs.find(blockDef => blockDef.id === ownProps.block.type),
  };
}


export default withRouter(connect(mapStateToProps)(Block));
