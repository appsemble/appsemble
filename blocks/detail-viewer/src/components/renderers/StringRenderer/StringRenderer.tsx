import React from 'react';

import { RendererProps } from '../../../../block';

/**
 * An element for a text type schema.
 */
export default class StringRenderer extends React.Component<RendererProps> {
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
