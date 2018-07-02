import {
  InputAdornment,
} from '@material-ui/core';
import {
  Email,
} from '@material-ui/icons';
import React from 'react';

import TextInput from '../TextInput';


/**
 * An input element for a text type schema with an email format.
 */
export default class EmailInput extends React.Component {
  render() {
    return (
      <TextInput
        {...this.props}
        InputProps={{
          startAdornment: (
            <InputAdornment>
              <Email />
            </InputAdornment>
          ),
        }}
        type="email"
      />
    );
  }
}
