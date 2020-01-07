import { connect } from 'react-redux';

import { State } from '../../actions';
import { push } from '../../actions/message';
import { requestPermission, subscribe, unsubscribe } from '../../actions/serviceWorker';
import AppSettings from './AppSettings';

function mapStateToProps(
  state: State,
): Partial<React.ComponentPropsWithoutRef<typeof AppSettings>> {
  return {
    definition: state.app.definition,
    subscribed: state.serviceWorker.subscribed,
  };
}

export default connect(mapStateToProps, { requestPermission, subscribe, push, unsubscribe })(
  AppSettings,
);
