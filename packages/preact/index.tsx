/** @jsx h */
import { bootstrap as sdkBootstrap, BootstrapParams, EventParams } from '@appsemble/sdk';
import IntlMessageFormat from 'intl-messageformat';
import { ComponentType, createContext, Fragment, h, render, VNode } from 'preact';
import { useContext } from 'preact/hooks';

export interface BlockProps<P = any, A = {}, E extends EventParams = {}>
  extends BootstrapParams<P, A, E> {
  /**
   * The DOM node on which the block is mounted.
   */
  preactRoot: Element;

  /**
   * A function that must be called to indicate the block is ready to be rendered.
   */
  ready: () => void;

  messages: Record<string, IntlMessageFormat>;
}

const Context = createContext<BlockProps>(null);

/**
 * Mount a Preact component returned by a bootstrap function in the shadow DOM of a block.
 */
export function mount<P, A = {}, E extends EventParams = {}>(
  Component: ComponentType<BlockProps<P, A, E>>,
  messages?: Record<string, string>,
  createRoot: () => Element = () => document.createElement('div'),
): (params: BootstrapParams<P, A, E>) => Promise<void> {
  return params =>
    new Promise(ready => {
      const preactRoot = params.shadowRoot.appendChild(createRoot());

      const props = {
        ...params,
        ready,
        preactRoot,
        messages: messages
          ? Object.entries(messages).reduce(
              (acc: Record<string, IntlMessageFormat>, [key, message]) => {
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
      render(component, preactRoot);
      params.utils.addCleanup(() => render(null, preactRoot, preactRoot));
    });
}

export function bootstrap<P, A = {}, E extends EventParams = {}>(
  Component: ComponentType<BlockProps<P, A, E>>,
  messages?: Record<string, string>,
  reactRoot?: () => Element,
): void {
  sdkBootstrap<P, A, E>(mount(Component, messages, reactRoot));
}

/**
 * A HOC which passes the Appsemble block values to he wrapped Preact component.
 */
export function withBlock<P extends object>(
  Component: ComponentType<Omit<BlockProps, keyof P> & P>,
): ComponentType<P> {
  return (props: P) => (
    // @ts-ignore
    <Context.Consumer>{values => <Component {...props} {...values} />}</Context.Consumer>
  );
}

export function useBlock(): BlockProps {
  return useContext(Context);
}

export interface FormattedMessageProps {
  id: string;
  values?: Record<string, number | string | ((str: string) => VNode)>;
}

export function FormattedMessage({ id, values }: FormattedMessageProps): VNode {
  const { messages } = useBlock();
  if (!Object.prototype.hasOwnProperty.call(messages, id)) {
    return <Fragment>Untranslated message ID: {id}</Fragment>;
  }
  const formattedMessage = messages[id].formatHTMLMessage(values);
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <Fragment>{formattedMessage}</Fragment>;
}
