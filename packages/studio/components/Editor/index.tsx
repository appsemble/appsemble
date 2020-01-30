import { connect } from 'react-redux';
import { RouteChildrenProps } from 'react-router-dom';

import { State } from '../../actions';
import { updateApp } from '../../actions/apps';
import Editor from './Editor';

function mapStateToProps(
  state: State,
  ownProps: RouteChildrenProps<{ id: string }>,
): Partial<React.ComponentPropsWithoutRef<typeof Editor>> {
  return {
    app: state.apps.apps.find(app => app.id === Number(ownProps.match.params.id)),
  };
}

export default connect(mapStateToProps, { updateApp })(Editor);
