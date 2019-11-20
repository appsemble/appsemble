import { connect } from 'react-redux';

import Main from './Main';

function mapStateToProps(state) {
  return { definition: state.app.definition };
}

export default connect(mapStateToProps)(Main);
