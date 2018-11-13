import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import { push } from '../../actions/message';
import Editor from './Editor';

export default injectIntl(
  connect(
    null,
    { push },
  )(Editor),
);
