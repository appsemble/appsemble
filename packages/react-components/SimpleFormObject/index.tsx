import { ReactChild, ReactElement, ReactNode, useCallback, useMemo } from 'react';

import { SimpleFormProvider, useSimpleForm } from '..';

interface SimpleFormObjectProps {
  /**
   * The children to provide the context for.
   */
  children: ReactChild | ReactChild[];

  /**
   * The name of the property that is used to store the values of the object.
   */
  name: string;
}

/**
 * Component that allows for defining objects when used in conjunction with `<SimpleForm />`.
 */
export function SimpleFormObject({ children, name }: SimpleFormObjectProps): ReactElement {
  const simpleForm = useSimpleForm();

  const setValue = useCallback(
    (nestedName: string, value: any, errorMessage?: ReactNode) =>
      simpleForm.setValue(name, { ...simpleForm.values[name], [nestedName]: value }, errorMessage),
    [name, simpleForm],
  );

  const setValues = useCallback(
    (values: any) => simpleForm.setValues({ ...simpleForm.values, [name]: values }),
    [name, simpleForm],
  );

  const formErrors = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(simpleForm.formErrors)
          .filter(([key]) => key.startsWith(`${name}.`))
          .map(([key, value]) => [key.replace(`${name}.`, ''), value]),
      ),

    [name, simpleForm.formErrors],
  );

  const setFormError = useCallback(
    (nestedName: string, error: ReactNode) =>
      simpleForm.setFormError(`${name}.${nestedName}`, error),
    [name, simpleForm],
  );

  const value = useMemo(
    () => ({
      ...simpleForm,
      values: simpleForm.values[name],
      setValue,
      setValues,
      setFormError,
      formErrors,
    }),
    [name, formErrors, setFormError, setValue, setValues, simpleForm],
  );

  return <SimpleFormProvider value={value}>{children}</SimpleFormProvider>;
}
