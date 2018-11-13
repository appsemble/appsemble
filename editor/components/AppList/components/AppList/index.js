import { connect } from 'react-redux';

import { getApps } from '../../../../actions/apps';
import AppList from './AppList';

export default connect(
  state => ({ apps: state.apps.apps, error: state.apps.error }),
  { getApps },
)(AppList);
