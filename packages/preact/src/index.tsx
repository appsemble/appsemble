import { BootstrapParams, bootstrap as sdkBootstrap } from '@appsemble/sdk';
import { ComponentType, createContext, render } from 'preact';
import { useContext } from 'preact/hooks';

export interface BlockProps extends BootstrapParams {
  /**
   * A function that must be called to indicate the block is ready to be rendered.
   */
  ready: () => void;
}

const Context = createContext<BlockProps>(null);

/**
 * Mount a Preact component returned by a bootstrap function in the shadow DOM of a block.
 *
 * @param Component - The Preact component to mount.
 *
 * @returns A promise which gets resolved if the component calls `ready()`.
 */
export function mount(
  Component: ComponentType<BlockProps>,
): (params: BootstrapParams) => Promise<void> {
  return (params) =>
    new Promise((ready) => {
      // eslint-disable-next-line react/jsx-no-constructed-context-values
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
