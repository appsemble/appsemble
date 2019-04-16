import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import CMS from './CMS';

function mapStateToProps(state) {
  return {
    user: state.user.user,
  };
}

export default injectIntl(connect(mapStateToProps)(CMS));
