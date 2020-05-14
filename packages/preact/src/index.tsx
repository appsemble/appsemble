import { bootstrap as sdkBootstrap, BootstrapParams } from '@appsemble/sdk';
import IntlMessageFormat from 'intl-messageformat';
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
 */
export function withBlock<P extends object>(
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
  if (!Object.prototype.hasOwnProperty.call(messages, id)) {
    return <Fragment>Untranslated message ID: {id}</Fragment>;
  }
  const formattedMessage = messages[id].format(values);
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <Fragment>{formattedMessage}</Fragment>;
}
