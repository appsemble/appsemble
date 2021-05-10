import { ReactChild, ReactElement, ReactNode, useCallback, useMemo } from 'react';

import { SimpleFormContext, useSimpleForm } from '..';

interface SimpleFormObjectProps {
  children: ReactChild | ReactChild[];
  name: string;
}

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

  return <SimpleFormContext.Provider value={value}>{children}</SimpleFormContext.Provider>;
}
