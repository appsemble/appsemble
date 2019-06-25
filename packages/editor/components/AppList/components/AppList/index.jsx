import { connect } from 'react-redux';

import { getApps } from '../../../../actions/apps';
import AppList from './AppList';

function mapStateToProps(state) {
  return {
    apps: state.apps.apps,
    error: state.apps.error,
    user: state.user.user,
  };
}

export default connect(
  mapStateToProps,
  { getApps },
)(AppList);
