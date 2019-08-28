/** @jsx h */
import { bootstrap as sdkBootstrap, BootstrapParams } from '@appsemble/sdk';
import { ComponentType, createContext, h, render, VNode } from 'preact';

// XXX Remove this when updating preact. https://github.com/preactjs/preact/pull/1887
declare module 'preact/src/jsx' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSXInternal {
    interface IntrinsicAttributes {
      key?: any;
    }
  }
}

export interface BlockProps<P = any, A = {}> extends BootstrapParams<P, A> {
  /**
   * The DOM node on which the block is mounted.
   */
  preactRoot: HTMLElement;
}

const { Consumer, Provider } = createContext<BlockProps>(null);

/**
 * Mount a Preact component returned by a bootstrap function in the shadow DOM of a block.
 */
export function mount<P, A = {}>(
  Component: ComponentType<BlockProps<P, A>>,
  root?: HTMLElement,
): (params: BootstrapParams<P, A>) => void {
  return params => {
    const preactRoot = params.shadowRoot.appendChild(
      root ? root.cloneNode() : document.createElement('div'),
    ) as HTMLElement;
    const props = {
      ...params,
      preactRoot,
    };
    const component = (
      <Provider value={props}>
        <Component {...props} />
      </Provider>
    );
    render(component, preactRoot);
    params.utils.addCleanup(() => render(null, preactRoot, preactRoot));
  };
}

export function bootstrap<P, A = {}>(
  Component: ComponentType<BlockProps<P, A>>,
  reactRoot?: HTMLElement,
): void {
  sdkBootstrap<P, A>(mount(Component, reactRoot));
}

/**
 * A HOC which passes the Appsemble block values to he wrapped Preact component.
 */
export function withBlock<P extends {}>(
  Component: ComponentType<P | BlockProps>,
): ComponentType<P> {
  return (props: P): VNode => <Consumer>{values => <Component {...values} {...props} />}</Consumer>;
}
