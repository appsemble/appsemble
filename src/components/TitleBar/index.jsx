import {
  connect,
} from 'react-redux';

import TitleBar from './TitleBar';


function mapStateToProps(state) {
  return {
    app: state.app.app,
  };
}


export default connect(mapStateToProps)(TitleBar);
