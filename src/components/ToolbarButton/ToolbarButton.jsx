import {
  IconButton,
} from '@material-ui/core';
import React from 'react';

import styles from './ToolbarButton.css';


export default class ToolbarButton extends React.Component {
  render() {
    const {
      ...extraProps
    } = this.props;

    return (
      <IconButton
        className={styles.root}
        color="inherit"
        {...extraProps}
      />
    );
  }
}
