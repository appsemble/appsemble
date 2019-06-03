import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { push } from '../../actions/message';
import UserSettings from './UserSettings';

export default injectIntl(
  connect(
    null,
    { push },
  )(UserSettings),
);
