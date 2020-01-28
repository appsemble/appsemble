import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import { State } from '../../actions';
import ResourceTable from './ResourceTable';

function mapStateToProps(
  state: State,
  ownProps: RouteComponentProps<{ id: string }>,
): Partial<React.ComponentPropsWithoutRef<typeof ResourceTable>> {
  return {
    app: state.apps.apps.find(app => app.id === Number(ownProps.match.params.id)),
  };
}

export default connect(mapStateToProps)(ResourceTable);
