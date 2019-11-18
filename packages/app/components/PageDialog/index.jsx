import { connect } from 'react-redux';

import { getBlockDefs } from '../../actions/blockDefs';
import PageDialog from './PageDialog';

export default connect(null, {
  getBlockDefs,
})(PageDialog);
