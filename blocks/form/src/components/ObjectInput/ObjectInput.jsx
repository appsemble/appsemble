import PropTypes from 'prop-types';
import React from 'react';
import {
  SchemaRenderer,
} from 'react-schema-renderer';


/**
 * An input element for an object type schema.
 */
export default class ObjectInput extends React.Component {
  static propTypes = {
    /**
     * Any children that are passed, are rendered below the other schema properties.
     */
    children: PropTypes.node,
    /**
     * The type of node to use.
     */
    component: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.object,
      PropTypes.string,
    ]),
    /**
     * The name of the property to render.
     */
    name: PropTypes.string,
    /**
     * A callback for when the value changes.
     */
    onChange: PropTypes.func.isRequired,
    /**
     * Wether or not a value is required.
     */
    required: PropTypes.bool,
    /**
     * The enum schema definition for which to render an input.
     */
    schema: PropTypes.shape().isRequired,
    /**
     * The current value.
     */
    value: PropTypes.shape(),
  };

  static defaultProps = {
    children: null,
    component: 'fieldset',
    name: null,
    required: null,
    value: {},
  };

  state = {
    value: {},
  };

  onChange = (event, val = event.target.value) => {
    // Synchronize the state value with the props. This allows to set the initial object values
    // child values in a way they don’t unset each other.
    this.setState(
      ({ value }) => ({
        value: {
          ...value,
          [event.target.name.split('.').pop()]: val,
        },
      }),
      () => {
        const {
          name,
          onChange,
        } = this.props;
        const {
          value,
        } = this.state;

        onChange({ target: { name } }, value);
      },
    );
  };

  render() {
    const {
      children,
      component: Component,
      onChange,
      name,
      required,
      schema,
      value,
      ...props
    } = this.props;

    return (
      <Component {...props}>
        {Object.entries(schema.properties).map(([subName, subSchema]) => (
          <SchemaRenderer
            key={subName}
            name={name == null ? subName : `${name}.${subName}`}
            onChange={this.onChange}
            required={schema.required?.includes(subName) || false}
            schema={subSchema}
            value={value[subName]}
          />
        ))}
        {children}
      </Component>
    );
  }
}
