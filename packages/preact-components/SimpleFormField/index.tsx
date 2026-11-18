import { type ComponentChildren, type ComponentType, type VNode } from 'preact';
import { type ChangeEvent, type ComponentPropsWithoutRef } from 'preact/compat';
import { useCallback, useEffect, useRef } from 'preact/hooks';

import { InputField } from '../InputField/index.js';
import { useSimpleForm } from '../SimpleForm/index.js';

type ValidityMessages = {
  [key in keyof Omit<ValidityState, 'valid'>]?: ComponentChildren;
};

export interface MinimalHTMLElement {
  value: any;
  validity?: ValidityState;
}

interface InputComponentProps {
  disabled: boolean;
  error: ComponentChildren;
  name: string;
  onChange: (event: ChangeEvent<EventTarget & MinimalHTMLElement>, value: any) => void;
  value: any;
}

type SimpleFormFieldProps<C extends ComponentType<any>> = Omit<
  ComponentPropsWithoutRef<C>,
  keyof InputComponentProps
> & {
  readonly component?: C;
  readonly disabled?: boolean;
  readonly name?: string;
  readonly onChange?: (event: ChangeEvent<EventTarget & MinimalHTMLElement>, value: any) => void;
  readonly preprocess?: (newValue: any, oldValues: Record<string, any>) => any;
  readonly validityMessages?: ValidityMessages;
  readonly value?: any;
};

export function SimpleFormField<C extends ComponentType<any> = typeof InputField>({
  component: Component = InputField as ComponentType<any> as C,
  disabled,
  name,
  onChange,
  preprocess,
  validityMessages = {},
  value,
  ...props
}: SimpleFormFieldProps<C>): VNode {
  const { formErrors, pristine, setFormError, setValue, submitting, values } = useSimpleForm();
  const ref = useRef<MinimalHTMLElement>(null);

  const validateValue = useCallback(
    (input: MinimalHTMLElement, key: string, val: string) => {
      const validity = input?.validity;
      let message: ComponentChildren;
      if (validity && !validity.valid) {
        const reason = Object.entries(validityMessages).find(
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore 2769 No overload matches this call (strictNullChecks)
          ([validityType]: [keyof ValidityMessages, ComponentChildren]) => validity[validityType],
        );
        message = reason ? reason[1] : true;
      }
      setValue(key, val, message);
    },
    [setValue, validityMessages],
  );

  const internalOnChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>, currentValue = event.currentTarget.value) => {
      const val = preprocess ? preprocess(currentValue, values) : currentValue;
      if (onChange) {
        onChange(event, val);
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
      validateValue(event?.currentTarget, name, val);
    },
    [name, onChange, preprocess, validateValue, values],
  );

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore 18048 variable is possibly undefined (strictNullChecks)
    if (!(name in formErrors)) {
      const validity = ref?.current?.validity;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
      setFormError(name, validity && !validity.valid);
    }
  }, [formErrors, name, setFormError]);

  return (
    // @ts-expect-error XXX This shouldn’t be necessary.
    <Component
      disabled={disabled || submitting}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore Messed up - undefined cannot be used as an index type
      error={!pristine[name] && formErrors[name]}
      name={name}
      onChange={internalOnChange}
      ref={ref}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore Messed up - undefined cannot be used as an index type
      value={value || values[name]}
      {...props}
    />
  );
}
