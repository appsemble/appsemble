import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { push } from '../../actions/message';
import RateApp from './RateApp';

export default injectIntl(connect(undefined, { push })(RateApp));
