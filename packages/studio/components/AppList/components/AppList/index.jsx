import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { getApps, getPublicApps } from '../../../../actions/apps';
import AppList from './AppList';

function mapStateToProps(state) {
  return {
    apps: state.apps.apps,
  };
}

export default injectIntl(connect(mapStateToProps, { getApps, getPublicApps })(AppList));
