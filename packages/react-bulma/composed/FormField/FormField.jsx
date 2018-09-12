import PropTypes from 'prop-types';
import React from 'react';

import {
  Control,
  Field,
  FieldBody,
  FieldLabel,
  Label,
} from '../../base';


export default class FormField extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    iconLeft: PropTypes.node,
    iconRight: PropTypes.node,
    label: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.string,
    ]),
    size: PropTypes.string,
  };

  static defaultProps = {
    iconLeft: null,
    iconRight: null,
    label: null,
    size: null,
  };

  render() {
    const {
      children,
      iconLeft,
      iconRight,
      label,
      size,
      ...props
    } = this.props;

    const control = (
      <Control iconsLeft={!!iconLeft} iconsRight={!!iconRight}>
        {React.cloneElement(children, { size })}
        {iconLeft && React.cloneElement(iconLeft, { size, position: 'left' })}
        {iconRight && React.cloneElement(iconRight, { size, position: 'right' })}
      </Control>
    );

    if (label != null) {
      return (
        <Field horizontal {...props}>
          <FieldLabel normal>
            <Label>
              {label}
            </Label>
          </FieldLabel>
          <FieldBody>
            <Field>
              {control}
            </Field>
          </FieldBody>
        </Field>
      );
    }

    return (
      <Field {...props}>
        {control}
      </Field>
    );
  }
}
