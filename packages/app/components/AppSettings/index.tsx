import { connect } from 'react-redux';

import { State } from '../../actions';
import { requestPermission, subscribe, unsubscribe } from '../../actions/serviceWorker';
import AppSettings from './AppSettings';

function mapStateToProps(
  state: State,
): Partial<React.ComponentPropsWithoutRef<typeof AppSettings>> {
  return {
    definition: state.app.definition,
    subscribed: state.serviceWorker.subscribed,
    registration: state.serviceWorker.registration,
  };
}

export default connect(mapStateToProps, { requestPermission, subscribe, unsubscribe })(AppSettings);
