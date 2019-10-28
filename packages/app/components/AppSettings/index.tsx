import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { State } from '../../actions';
import { push } from '../../actions/message';
import { requestPermission, subscribe, unsubscribe } from '../../actions/serviceWorker';
import AppSettings, { AppSettingsProps } from './AppSettings';

function mapStateToProps(state: State): Partial<AppSettingsProps> {
  return {
    subscribed: state.serviceWorker.subscribed,
    permission: state.serviceWorker.permission,
  };
}

export default injectIntl(
  connect(
    mapStateToProps,
    { requestPermission, subscribe, push, unsubscribe },
  )(AppSettings),
);
