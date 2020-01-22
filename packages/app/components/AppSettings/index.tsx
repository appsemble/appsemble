import { connect } from 'react-redux';

import { State } from '../../actions';
import AppSettings from './AppSettings';

function mapStateToProps(
  state: State,
): Partial<React.ComponentPropsWithoutRef<typeof AppSettings>> {
  return {
    definition: state.app.definition,
  };
}

export default connect(mapStateToProps)(AppSettings);
