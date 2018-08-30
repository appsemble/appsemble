import PropTypes from 'prop-types';
import React from 'react';

import UnsupportedSchema from '../UnsupportedSchema';


/**
 * Render a component based on a JSON schema.
 *
 * This uses the renderes provided by the `<SchemaProvider />`.
 */
export default class SchemaRenderer extends React.Component {
  static propTypes = {
    /**
     * A name to pass as the fake event when populating the schema.
     */
    name: PropTypes.string,
    populate: PropTypes.func,
    renderers: PropTypes.shape().isRequired,
    /**
     * The schema for which to render a component.
     */
    schema: PropTypes.shape().isRequired,
    /**
     * The value to render. If this value is undefined, the default value provided by  the JSON
     * schema is used.
     */
    // eslint-disable-next-line react/forbid-prop-types
    value: PropTypes.any,
  };

  static defaultProps = {
    name: null,
    populate: null,
    value: undefined,
  };

  componentDidMount() {
    const {
      name,
      populate,
      schema,
    } = this.props;

    if (populate == null) {
      return;
    }

    let value = this.getValue();

    if (value === undefined) {
      const Component = this.getComponent();
      value = Component.defaultProps?.value;
    }

    if (value === undefined && schema.enum) {
      ([value] = schema.enum);
    }

    populate({ target: { name } }, value);
  }

  getComponent() {
    const {
      renderers,
      schema,
    } = this.props;

    const type = schema.enum ? 'enum' : schema.type;

    if (!Object.hasOwnProperty.call(renderers, type)) {
      return UnsupportedSchema;
    }

    return renderers[type];
  }

  getValue() {
    const {
      value,
      schema,
    } = this.props;

    if (value !== undefined) {
      return value;
    }

    if (Object.hasOwnProperty.call(schema, 'default')) {
      return schema.default;
    }

    return undefined;
  }

  render() {
    const {
      populate,
      renderers,
      schema,
      value,
      ...props
    } = this.props;

    const Component = this.getComponent();

    return (
      <Component
        schema={schema}
        value={this.getValue()}
        {...props}
      />
    );
  }
}
