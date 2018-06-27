import React from 'react';
import {
  render,
} from 'react-dom';
import retargetEvents from 'react-shadow-dom-retarget-events';


/**
 * Mount a React component returned by a bootstrap function in the shadow DOM of a block.
 */
// eslint-disable-next-line import/prefer-default-export
export function mount(Component) {
  return (params) => {
    const reactRoot = params.shadowRoot.appendChild(document.createElement('div'));
    const component = <Component {...params} reactRoot={reactRoot} />;
    render(component, reactRoot);
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
