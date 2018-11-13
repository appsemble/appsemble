import { connect } from 'react-redux';

import { push } from '../../actions/message';
import Editor from './Editor';

export default connect(
  null,
  { push },
)(Editor);
