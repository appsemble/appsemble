import PropTypes from 'prop-types';
import React from 'react';

import { Control, Field, FieldBody, FieldLabel, Help, Label } from '../../base';

export default class FormField extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    iconLeft: PropTypes.node,
    iconRight: PropTypes.node,
    help: PropTypes.node,
    label: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
    size: PropTypes.string,
  };

  static defaultProps = {
    iconLeft: null,
    iconRight: null,
    label: null,
    help: null,
    size: null,
  };

  render() {
    const { children, color, iconLeft, iconRight, label, help, size, ...props } = this.props;

    const control = (
      <React.Fragment>
        <Control iconsLeft={!!iconLeft} iconsRight={!!iconRight}>
          {React.cloneElement(React.Children.only(children), { size })}
          {iconLeft && React.cloneElement(iconLeft, { size, position: 'left' })}
          {iconRight && React.cloneElement(iconRight, { size, position: 'right' })}
        </Control>
        {help && <Help color={color}>{help}</Help>}
      </React.Fragment>
    );

    if (label != null) {
      return (
        <Field color={color} horizontal {...props}>
          <FieldLabel normal>
            <Label>{label}</Label>
          </FieldLabel>
          <FieldBody>
            <Field>{control}</Field>
          </FieldBody>
        </Field>
      );
    }

    return (
      <Field color={color} {...props}>
        {control}
      </Field>
    );
  }
}
