import type { BootstrapParams } from '@appsemble/sdk';
import { bootstrap as sdkBootstrap } from '@appsemble/sdk';
import React, { ComponentType, createContext, ReactElement } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import retargetEvents from 'react-shadow-dom-retarget-events';

export { provideIntl } from './intl';

export interface BlockProps extends BootstrapParams {
  /**
   * The DOM node on which the block is mounted.
   */
  reactRoot: HTMLElement;
}

const { Consumer, Provider } = createContext<BlockProps>(null);

/**
 * Mount a React component returned by a bootstrap function in the shadow DOM of a block.
 */
export function mount(
  Component: ComponentType<BlockProps>,
  root?: HTMLElement,
): (params: BootstrapParams) => void {
  return (params) => {
    const reactRoot = params.shadowRoot.appendChild(
      root ? root.cloneNode() : document.createElement('div'),
    ) as HTMLElement;
    const props = {
      ...params,
      reactRoot,
    };
    const component: ReactElement = (
      <Provider value={props}>
        <Component {...props} />
      </Provider>
    );
    render(component, reactRoot);
    params.utils.addCleanup(() => unmountComponentAtNode(reactRoot));
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

export function bootstrap(Component: ComponentType<BlockProps>, reactRoot?: HTMLElement): void {
  sdkBootstrap(mount(Component, reactRoot));
}

/**
 * A HOC which passes the Appsemble block values to he wrapped React component.
 */
export function withBlock<P extends object>(
  Component: ComponentType<P & Omit<BlockProps, keyof P>>,
): ComponentType<P> {
  function Wrapper(props: P): ReactElement {
    return <Consumer>{(values) => <Component {...values} {...props} />}</Consumer>;
  }
  if (process.env.NODE_ENV !== 'production') {
    Wrapper.displayName = `withBlock(${Component.displayName || Component.name})`;
  }
  return Wrapper;
}
