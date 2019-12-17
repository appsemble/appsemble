import { connect } from 'react-redux';

import { State } from '../../actions';
import TitleBar, { TitleBarProps } from './TitleBar';

function mapStateToProps(state: State): Partial<TitleBarProps> {
  return {
    user: state.user.user,
  };
}

export default connect(mapStateToProps)(TitleBar);
