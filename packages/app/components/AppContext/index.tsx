import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { State } from '../../actions';
import { getApp } from '../../actions/app';
import { initAuth } from '../../actions/user';
import AppContext, { AppContextProps } from './AppContext';

function mapStateToProps(state: State): Partial<AppContextProps> {
  return {
    definition: state.app.definition,
    ready: !!state.user.initialized,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    getApp,
    initAuth,
  })(AppContext),
);
