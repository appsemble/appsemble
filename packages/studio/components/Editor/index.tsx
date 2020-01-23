import { connect } from 'react-redux';
import { RouteChildrenProps } from 'react-router-dom';

import { State } from '../../actions';
import { updateApp } from '../../actions/apps';
import { getOpenApiSpec } from '../../actions/openApi';
import Editor from './Editor';

function mapStateToProps(
  state: State,
  ownProps: RouteChildrenProps<{ id: string }>,
): Partial<React.ComponentPropsWithoutRef<typeof Editor>> {
  return {
    app: state.apps.apps.find(app => app.id === Number(ownProps.match.params.id)),
    openApiSpec: state.openApi.spec,
  };
}

export default connect(mapStateToProps, { getOpenApiSpec, updateApp })(Editor);
