import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { State } from '../../actions';
import { updateApp } from '../../actions/apps';
import AppDetails from './AppDetails';

function mapStateToProps(
  state: State,
  ownProps: React.ComponentPropsWithoutRef<typeof AppDetails>,
): Partial<React.ComponentPropsWithoutRef<typeof AppDetails>> {
  return {
    app: state.apps.apps.find(app => app.id === Number(ownProps.match.params.id)),
  };
}

export default withRouter(connect(mapStateToProps, { updateApp })(AppDetails));
