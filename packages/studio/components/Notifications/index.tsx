import { App } from '@appsemble/types';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { push } from '../../actions/message';
import Notifications, { NotificationsProps } from './Notifications';

function mapStateToProps(
  state: { apps: { apps: App[] } },
  ownProps: NotificationsProps,
): Partial<NotificationsProps> {
  return {
    app: state.apps.apps.find(app => app.id === Number(ownProps.match.params.id)),
  };
}

export default injectIntl(connect(mapStateToProps, { push })(Notifications));
