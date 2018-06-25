import {
  connect,
} from 'react-redux';

import Block from './Block';


function mapStateToProps(state, ownProps) {
  return {
    blockDef: state.blockDefs.blockDefs.find(blockDef => blockDef.id === ownProps.block.type),
  };
}


export default connect(mapStateToProps)(Block);
