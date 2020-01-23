import { connect } from 'react-redux';
import { RouteChildrenProps } from 'react-router-dom';

import { State } from '../../actions';
import CMSRoot from './CMSRoot';

function mapStateToProps(
  state: State,
  ownProps: RouteChildrenProps<{ id: string }>,
): React.ComponentPropsWithoutRef<typeof CMSRoot> {
  return {
    app: state.apps.apps.find(app => app.id === Number(ownProps.match.params.id)),
  };
}

export default connect(mapStateToProps)(CMSRoot);
