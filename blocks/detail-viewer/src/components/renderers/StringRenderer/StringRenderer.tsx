import { BlockProps } from '@appsemble/react';
import React from 'react';

import { Field } from '../../../../block';

interface StringRendererProps extends Partial<BlockProps> {
  /**
   * Structure used to define this field.
   */
  field: Field;

  /**
   * The current value.
   */
  value: any;

  data: any;
}

/**
 * An element for a text type schema.
 */
export default class StringRenderer extends React.Component<StringRendererProps> {
  static defaultProps = {
    value: '',
  };

  render(): JSX.Element {
    const { field, value } = this.props;

    return (
      <React.Fragment>
        <h6 className="title is-6">{field.label || field.name}</h6>
        <div className="content">{typeof value === 'string' ? value : JSON.stringify(value)}</div>
      </React.Fragment>
    );
  }
}
