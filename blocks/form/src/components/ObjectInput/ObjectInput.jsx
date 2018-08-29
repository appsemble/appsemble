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
    block: PropTypes.shape().isRequired,
    /**
     * Any children that are passed, are rendered below the other schema properties.
     */
    children: PropTypes.node,
    /**
     * Passed to the root component.
     */
    className: PropTypes.string,
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
     * Passed to the root component.
     */
    noValidate: PropTypes.bool,
    /**
     * A callback for when the value changes.
     */
    onChange: PropTypes.func.isRequired,
    /**
     * Passed to the root component.
     */
    onSubmit: PropTypes.func,
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
    className: null,
    component: 'fieldset',
    name: null,
    noValidate: null,
    onSubmit: null,
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
      block,
      children,
      className,
      component: Component,
      name,
      noValidate,
      onSubmit,
      schema,
      value,
    } = this.props;

    return (
      <Component className={className} noValidate={noValidate} onSubmit={onSubmit}>
        {Object.entries(schema.properties).map(([subName, subSchema]) => {
          const propName = name == null ? subName : `${name}.${subName}`;
          return block.parameters.hidden?.includes(propName) || (
            <SchemaRenderer
              key={subName}
              name={propName}
              onChange={this.onChange}
              required={schema.required?.includes(subName) || false}
              schema={subSchema}
              value={value[subName]}
            />
          );
        })}
        {children}
      </Component>
    );
  }
}
