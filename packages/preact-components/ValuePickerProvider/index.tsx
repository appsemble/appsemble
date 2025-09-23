import { type ComponentChildren, createContext, type JSX, type Ref, type VNode } from 'preact';
import { type MutableRef, useContext, useMemo } from 'preact/hooks';

interface ValuePickerContext<T> {
  /**
   * The name of the field.
   */
  readonly name?: string;

  /**
   * The change handler for if a value changes.
   */
  readonly onChange: (event: JSX.TargetedEvent<HTMLElement>, value: T) => void;

  /**
   * The current value.
   */
  readonly value: T;
}

const Context = createContext<ValuePickerContext<unknown> | null>(null);

export interface ValuePickerProviderProps<T> extends ValuePickerContext<T> {
  readonly children: ComponentChildren;

  /**
   * The ref to the element used for scrolling to the field error
   */
  readonly errorLinkRef?: MutableRef<HTMLElement>;
}

/**
 * A provider for the value picker context.
 *
 * This allows to create customized components that work similar to HTML select boxes, such as radio
 * groups.
 */
export function ValuePickerProvider<T>({
  children,
  errorLinkRef,
  name,
  onChange,
  value,
}: ValuePickerProviderProps<T>): VNode {
  const context = useMemo(() => ({ name, onChange, value }), [name, onChange, value]);

  return (
    <>
      <span ref={errorLinkRef as unknown as Ref<HTMLDivElement>} />
      <Context.Provider value={context}>{children}</Context.Provider>
    </>
  );
}

/**
 * Get the value of the value picker context
 *
 * @returns The context for the value picker provider.
 */
export function useValuePicker<T>(): ValuePickerContext<T> {
  return useContext(Context) as ValuePickerContext<T>;
}
