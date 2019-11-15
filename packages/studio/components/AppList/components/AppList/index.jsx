import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { getApps, getPublicApps } from '../../../../actions/apps';
import AppList from './AppList';

function mapStateToProps(state) {
  return {
    apps: state.apps.apps,
    error: state.apps.error,
    user: state.user.user,
  };
}

export default injectIntl(connect(mapStateToProps, { getApps, getPublicApps })(AppList));
