import * as React from 'react';

interface FormProps {
  /**
   * The form child nodes.
   */
  children: React.ReactNode;

  /**
   * The submit event handler for the form.
   */
  onSubmit: React.FormEventHandler<HTMLFormElement>;
}

/**
 * A simple form wrapper that ensures `noValidate` is passed and `onSubmit` is used.
 */
export default class Form extends React.Component<
  FormProps & React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>
> {
  render(): React.ReactNode {
    return <form {...this.props} noValidate />;
  }
}
