import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { State } from '../../actions';
import { updateApp } from '../../actions/apps';
import { push } from '../../actions/message';
import AppDetails, { AppDetailsProps } from './AppDetails';

function mapStateToProps(state: State, ownProps: AppDetailsProps): Partial<AppDetailsProps> {
  return {
    user: state.user.user,
    app: state.apps.apps.find(app => app.id === Number(ownProps.match.params.id)),
  };
}

export default withRouter(connect(mapStateToProps, { updateApp, push })(AppDetails));
