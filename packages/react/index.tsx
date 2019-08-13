import { bootstrap as sdkBootstrap, BootstrapParams } from '@appsemble/sdk';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import retargetEvents from 'react-shadow-dom-retarget-events';

export interface BlockProps<P = any, A = {}> extends BootstrapParams<P, A> {
  /**
   * The DOM node on which the block is mounted.
   */
  reactRoot: HTMLElement;
}

const { Consumer, Provider } = React.createContext<BlockProps>(null);

/**
 * Mount a React component returned by a bootstrap function in the shadow DOM of a block.
 */
export function mount<P, A = {}>(
  Component: React.ComponentType<BlockProps<P, A>>,
  root?: HTMLElement,
): (params: BootstrapParams<P, A>) => void {
  return params => {
    const reactRoot = params.shadowRoot.appendChild(
      root ? root.cloneNode() : document.createElement('div'),
    ) as HTMLElement;
    const props = {
      ...params,
      reactRoot,
    };
    const component: JSX.Element = (
      <Provider value={props}>
        <Component {...props} />
      </Provider>
    );
    ReactDOM.render(component, reactRoot);
    params.utils.addCleanup(() => ReactDOM.unmountComponentAtNode(reactRoot));
    /**
     * React doesn’t play nice with shadow DOM. This library works around that. However, the
     * implementation does contain some bugs.
     *
     * Related issues:
     *
     * - https://github.com/facebook/react/issues/2043
     * - https://github.com/facebook/react/issues/9242
     * - https://github.com/facebook/react/issues/10422
     * - https://github.com/facebook/react/issues/12973
     * - https://github.com/facebook/react/pull/8117
     * - https://github.com/facebook/react/pull/12163
     *
     * @todo Remove this when React has fixes this issue.
     */
    retargetEvents(params.shadowRoot);
  };
}

export function bootstrap<P, A = {}>(
  Component: React.ComponentType<BlockProps<P, A>>,
  reactRoot?: HTMLElement,
): void {
  sdkBootstrap<P, A>(mount(Component, reactRoot));
}

/**
 * A HOC which passes the Appsemble block values to he wrapped React component.
 */
export function withBlock<P extends object>(
  Component: React.ComponentType<P & Omit<BlockProps, keyof P>>,
): React.ComponentType<P> {
  function Wrapper(props: P): JSX.Element {
    return <Consumer>{values => <Component {...values} {...props} />}</Consumer>;
  }
  if (process.env.NODE_ENV !== 'production') {
    Wrapper.displayName = `withBlock(${Component.displayName || Component.name})`;
  }
  return Wrapper;
}
