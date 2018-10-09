import { IconButton } from '@material-ui/core';
import React from 'react';

import styles from './ToolbarButton.css';

/**
 * A button which is styled explicitly for use in an app bar.
 */
export default class ToolbarButton extends React.Component {
  render() {
    return <IconButton className={styles.root} color="inherit" {...this.props} />;
  }
}
