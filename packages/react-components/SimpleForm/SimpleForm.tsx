import React from 'react';

import Form from '../Form';

type ChangeEvent = React.ChangeEvent<{ name: string; value?: any }>;

type ChangeHandler = (event: ChangeEvent, value: any) => void;

interface SimpleFormProps<T> extends Omit<React.ComponentProps<typeof Form>, 'onSubmit' | 'ref'> {
  children: React.ReactNode;
  defaultValues: T;
  onSubmit: (values: T) => any;
  resetOnSuccess?: boolean;
}

export interface InjectedSimpleFormControlProps {
  disabled?: boolean;
  onChange?: ChangeHandler;
  submitting: boolean;
}

interface SimpleFormContext {
  onChange: ChangeHandler;
  pristine: boolean;
  setValue: (name: string, value: any) => void;
  setValues: (values: Record<string, any>) => void;
  submitError?: Error;
  submitting: boolean;
  values: Record<string, any>;
}

const Context = React.createContext<SimpleFormContext>(null);

export default function SimpleForm<T extends {}>({
  children,
  defaultValues,
  onSubmit,
  resetOnSuccess,
  ...props
}: SimpleFormProps<T>): React.ReactElement {
  const [values, setValues] = React.useState<T>(defaultValues);
  const [submitError, setSubmitError] = React.useState<Error>(null);
  const [pristine, setPristine] = React.useState<boolean>(true);
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  function reset(): void {
    setValues(defaultValues);
    setPristine(true);
  }

  async function doSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setSubmitError(err);
      return;
    } finally {
      setSubmitting(false);
    }
    setSubmitError(null);
    if (resetOnSuccess) {
      reset();
    }
  }

  function setValue(name: string, value: any): void {
    setPristine(false);
    setValues({
      ...values,
      [name]: value,
    });
  }

  function onChange({ target }: ChangeEvent, value = target.value): void {
    setValue(target.name, value);
  }

  return (
    <Form {...props} onSubmit={doSubmit}>
      <Context.Provider
        value={{
          onChange,
          pristine,
          setValue,
          setValues,
          submitError,
          submitting,
          values,
        }}
      >
        {children}
      </Context.Provider>
    </Form>
  );
}

export function useSimpleForm(): SimpleFormContext {
  return React.useContext(Context);

  // return [values[name], (value: any) => setValues({ ...values, [name]: value })];
}

// export default class SimpleForm<T extends {}> extends React.Component<
//   SimpleFormProps<T> & Omit<React.HTMLProps<HTMLFormElement>, keyof SimpleFormProps<T>>,
//   SimpleFormState<T>
// > {
//   state: SimpleFormState<T> = {
//     submitting: false,
//     values: this.props.defaultValues,
//   };

//   onChange: ChangeHandler = (event, value) => {
//     const { name } = event.target;
//     this.setState(({ values }) => ({
//       values: {
//         ...values,
//         [name]: value,
//       },
//     }));
//   };

//   onSubmit = async (event: React.FormEvent): Promise<void> => {
//     const { onSubmit } = this.props;
//     event.preventDefault();

//     this.setState({ submitting: true });
//     const { values } = this.state;
//     try {
//       await onSubmit(values);
//     } catch (error) {
//       // this.setState({ error });
//     }
//     this.setState({ submitting: false });
//   };

//   render(): JSX.Element {
//     const { defaultValues, onSubmit, ref, ...props } = this.props;
//     const { submitting, values } = this.state;

//     return (
//       <Provider value={{ submitting, onChange: this.onChange, values }}>
//         <Form onSubmit={this.onSubmit} {...props} />
//       </Provider>
//     );
//   }
// }

// export function withSimpleForm<P extends object>(
//   Component: React.ComponentType<P & InjectedSimpleFormControlProps>,
// ): React.ComponentType<P & ExtraSimpleFormControlProps> {
//   function Wrapper({ preprocess, ...props }: P & ExtraSimpleFormControlProps): JSX.Element {
//     return (
//       <Consumer>
//         {({ onChange, submitting, values }) => (
//           <Component
//             {...props}
//             disabled={props.disabled || submitting}
//             onChange={(event, value) =>
//               onChange(event, preprocess ? preprocess(value, values[props.name]) : value)
//             }
//             submitting={submitting}
//             value={values[props.name]}
//           />
//         )}
//       </Consumer>
//     );
//   }
//   if (process.env.NODE_ENV !== 'production') {
//     Wrapper.displayName = `withSimpleForm(${Component.displayName || Component.name})`;
//   }
//   return Wrapper;
// }
