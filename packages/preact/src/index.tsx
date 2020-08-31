import { BootstrapParams, bootstrap as sdkBootstrap } from '@appsemble/sdk';
import { IntlMessageFormat } from 'intl-messageformat';
import { ComponentType, createContext, Fragment, h, render, VNode } from 'preact';
import { useContext } from 'preact/hooks';

export interface BlockProps extends BootstrapParams {
  /**
   * A function that must be called to indicate the block is ready to be rendered.
   */
  ready: () => void;

  messages: { [id: string]: IntlMessageFormat };
}

const Context = createContext<BlockProps>(null);

/**
 * Mount a Preact component returned by a bootstrap function in the shadow DOM of a block.
 *
 * @param Component - The Preact component to mount.
 * @param messages - Translatable messages to serve (deprecated).
 *
 * @returns A promise which gets resolved if the component calls `ready()`.
 */
export function mount(
  Component: ComponentType<BlockProps>,
  messages?: { [id: string]: string },
): (params: BootstrapParams) => Promise<void> {
  return (params) =>
    new Promise((ready) => {
      const props = {
        ...params,
        ready,
        messages: messages
          ? Object.entries(messages).reduce(
              (acc: { [id: string]: IntlMessageFormat }, [key, message]) => {
                acc[key] = new IntlMessageFormat(message);
                return acc;
              },
              {},
            )
          : {},
      };
      const component = (
        <Context.Provider value={props}>
          <Component {...props} />
        </Context.Provider>
      );
      render(component, params.shadowRoot);
      params.utils.addCleanup(() => render(null, params.shadowRoot));
    });
}

export function bootstrap(
  Component: ComponentType<BlockProps>,
  messages?: { [id: string]: string },
): void {
  sdkBootstrap(mount(Component, messages));
}

/**
 * A HOC which passes the Appsemble block values to he wrapped Preact component.
 *
 * @deprecated Use `useBlock()` instead.
 *
 * @param Component - The Preact componen to wrap.
 *
 * @returns The wrapper component.
 */
export function withBlock<P extends {}>(
  Component: ComponentType<Omit<BlockProps, keyof P> & P>,
): ComponentType<P> {
  return (props: P) => (
    <Context.Consumer>{(values) => <Component {...props} {...values} />}</Context.Consumer>
  );
}

export function useBlock(): BlockProps {
  return useContext(Context);
}

export interface FormattedMessageProps {
  id: string;
  values?: { [key: string]: number | string | ((str: string) => VNode) };
}

export function FormattedMessage({ id, values }: FormattedMessageProps): VNode {
  const { messages } = useBlock();
  if (!Object.hasOwnProperty.call(messages, id)) {
    return <Fragment>Untranslated message ID: {id}</Fragment>;
  }
  const formattedMessage = messages[id].format(values as any);
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <Fragment>{formattedMessage as string}</Fragment>;
}
