import { createContext, ReactElement, ReactNode, SyntheticEvent, useContext, useMemo } from 'react';

interface ValuePickerContext<T> {
  /**
   * The name of the field.
   */
  name?: string;

  /**
   * The change handler for if a value changes.
   */
  onChange: (event: SyntheticEvent, value: T) => void;

  /**
   * The current value.
   */
  value: T;
}

const Context = createContext<ValuePickerContext<unknown>>(null);

export interface ValuePickerProviderProps<T> extends ValuePickerContext<T> {
  children: ReactNode;
}

/**
 * A provider for the value picker context.
 *
 * This allows to create customized components that work similar to HTML select boxes, such as radio
 * groups.
 */
export function ValuePickerProvider<T>({
  children,
  name,
  onChange,
  value,
}: ValuePickerProviderProps<T>): ReactElement {
  const context = useMemo(() => ({ name, onChange, value }), [name, onChange, value]);

  return <Context.Provider value={context}>{children}</Context.Provider>;
}

/**
 * Get the value of the value picker context
 *
 * @returns The context of the value picker.
 */
export function useValuePicker<T>(): ValuePickerContext<T> {
  return useContext(Context) as ValuePickerContext<T>;
}
