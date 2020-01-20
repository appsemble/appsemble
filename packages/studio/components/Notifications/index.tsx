import { App } from '@appsemble/types';
import { connect } from 'react-redux';

import Notifications from './Notifications';

function mapStateToProps(
  state: { apps: { apps: App[] } },
  ownProps: React.ComponentPropsWithoutRef<typeof Notifications>,
): Partial<React.ComponentPropsWithoutRef<typeof Notifications>> {
  return {
    app: state.apps.apps.find(app => app.id === Number(ownProps.match.params.id)),
  };
}

export default connect(mapStateToProps)(Notifications);
