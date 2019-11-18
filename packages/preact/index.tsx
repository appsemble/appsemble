/** @jsx h */
import { bootstrap as sdkBootstrap, BootstrapParams } from '@appsemble/sdk';
import IntlMessageFormat from 'intl-messageformat';
import { ComponentType, createContext, Fragment, h, render, VNode } from 'preact';
import { useContext } from 'preact/hooks';

export interface BlockProps<P = any, A = {}> extends BootstrapParams<P, A> {
  /**
   * The DOM node on which the block is mounted.
   */
  preactRoot: Element;

  messages: Record<string, IntlMessageFormat>;
}

const Context = createContext<BlockProps>(null);

/**
 * Mount a Preact component returned by a bootstrap function in the shadow DOM of a block.
 */
export function mount<P, A = {}>(
  Component: ComponentType<BlockProps<P, A>>,
  messages?: Record<string, string>,
  createRoot: () => Element = () => document.createElement('div'),
): (params: BootstrapParams<P, A>) => void {
  return params => {
    const preactRoot = params.shadowRoot.appendChild(createRoot());

    const props = {
      ...params,
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
  };
}

export function bootstrap<P, A = {}>(
  Component: ComponentType<BlockProps<P, A>>,
  messages?: Record<string, string>,
  reactRoot?: () => Element,
): void {
  sdkBootstrap<P, A>(mount(Component, messages, reactRoot));
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
