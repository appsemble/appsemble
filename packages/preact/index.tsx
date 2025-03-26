import { type BootstrapParams, type Messages, bootstrap as sdkBootstrap } from '@appsemble/sdk';
import { type ComponentChild, type ComponentType, createContext, render, type VNode } from 'preact';
import { useContext } from 'preact/hooks';

export interface BlockProps extends BootstrapParams {
  /**
   * A function that must be called to indicate the block is ready to be rendered.
   */
  ready: () => void;
}

// eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
// @ts-ignore 2345 argument of type is not assignable to parameter of type (strictNullChecks)
const Context = createContext<BlockProps>(null);

/**
 * Mount a Preact component returned by a bootstrap function in the shadow DOM of a block.
 *
 * @param Component The Preact component to mount.
 * @returns A promise which gets resolved if the component calls `ready()`.
 */
export function mount(
  Component: ComponentType<BlockProps>,
): (params: BootstrapParams) => Promise<void> {
  return (params) =>
    new Promise((ready) => {
      const props = {
        ...params,
        ready,
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

export function bootstrap(Component: ComponentType<BlockProps>): void {
  sdkBootstrap(mount(Component));
}

/**
 * A HOC which passes the Appsemble block values to he wrapped Preact component.
 *
 * @param Component The Preact component to wrap.
 * @returns The wrapper component.
 * @deprecated Use `useBlock()` instead.
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

interface FormattedMessagePropsWithoutValues<M extends keyof Messages> {
  /**
   * The ID of the message to render.
   */
  id: M;
}

interface FormattedMessagePropsWithValues<M extends keyof Messages> {
  /**
   * The ID of the message to render.
   */
  id: M;

  /**
   * Values to pass to the formatted message.
   */
  values: Messages[M] extends never ? undefined : Messages[M];
}

/**
 * Render an Appsemble message.
 */
export function FormattedMessage<M extends keyof Messages>(
  props: Messages[M] extends never
    ? FormattedMessagePropsWithoutValues<M>
    : FormattedMessagePropsWithValues<M>,
): VNode {
  const { utils } = useBlock();

  // @ts-expect-error The messages interface isn’t implemented within the Preact SDK.
  return utils.formatMessage(props.id, props.values) as ComponentChild as VNode;
}
