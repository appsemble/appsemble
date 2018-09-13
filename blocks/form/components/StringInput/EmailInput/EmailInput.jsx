import {
  Icon,
} from '@appsemble/react-bulma';
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
        iconLeft={<Icon fa="envelope" />}
        type="email"
      />
    );
  }
}
