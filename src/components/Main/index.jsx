import {
  connect,
} from 'react-redux';

import Main from './Main';


function mapStateToProps(state) {
  return {
    app: state.app.app,
  };
}


export default connect(mapStateToProps)(Main);
