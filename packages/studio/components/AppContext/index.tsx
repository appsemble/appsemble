// import { connect } from 'react-redux';
// import { RouteComponentProps, withRouter } from 'react-router-dom';
//
// import { State } from '../../actions';
// import { getApp } from '../../actions/apps';
import AppContext from './AppContext';

// function mapStateToProps(
//   state: State,
//   ownProps: RouteComponentProps<{ id: string }>,
// ): Partial<React.ComponentPropsWithoutRef<typeof AppContext>> {
//   return {
//     app:
//       state.apps.apps.length > 0 &&
//       state.apps.apps.find(app => app.id === Number(ownProps.match.params.id)),
//     ready: !!state.apps.apps.length,
//   };
// }
//
// export default withRouter(
//   connect(mapStateToProps, {
//     getApp,
//   })(AppContext),
// );

export { default } from './AppContext';
