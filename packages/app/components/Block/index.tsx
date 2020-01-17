import { connect } from 'react-redux';

import { State } from '../../actions';
import { blockToString } from '../../utils/blockUtils';
import Block from './Block';

function mapStateToProps(
  state: State,
  ownProps: Omit<
    React.ComponentPropsWithoutRef<typeof Block>,
    'definition' | 'blockDef' | 'showMessage'
  >,
): Pick<React.ComponentPropsWithoutRef<typeof Block>, 'definition' | 'blockDef'> {
  return {
    definition: state.app.definition,
    blockDef: state.blockDefs.blockDefs[blockToString(ownProps.block)],
  };
}

export default connect(mapStateToProps)(Block);
