import { connect } from 'react-redux';

import '../../index.css';
import { push } from '../../../app/actions/message';
import Editor from './Editor';

export default connect(
  null,
  { push },
)(Editor);
