import { connect } from 'react-redux';

import { State } from '../../../../actions';
import { getApps, getPublicApps } from '../../../../actions/apps';
import AppList from './AppList';

function mapStateToProps(state: State): Partial<React.ComponentPropsWithoutRef<typeof AppList>> {
  return {
    apps: state.apps.apps,
  };
}

export default connect(mapStateToProps, { getApps, getPublicApps })(AppList);
