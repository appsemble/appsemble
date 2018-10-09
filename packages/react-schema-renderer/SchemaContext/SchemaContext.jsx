import React from 'react';

const { Consumer, Provider } = React.createContext();

/**
 * Options provided to the `<SchemaProvider />`.
 * @typedef SchemaProviderOptions
 * @property {Object<string, Component>} renderers An object which maps JSON schema types to a React
 * component which represents that type. A special property `enum` is also accepted, which is used
 * for a JSON schema which defines an enum instead of a type.
 * @property {string} populate If true, the prop named of the `<SchemaRenderer />` named after this
 * value will be called when the renderer is mounted..
 */

/**
 * A provider for `<SchemaRenderer />` options.
 *
 * This provider takes a {@link SchemaProviderOptions} object.
 */
export { Provider as SchemaProvider };

/**
 * A HOC which passes schema renderes to the underlying component.
 */
export function withSchema(Component) {
  function Wrapper(props) {
    return (
      <Consumer>
        {({ populate, renderers }) => (
          <Component
            populate={populate == null ? undefined : props[populate]}
            renderers={renderers}
            {...props}
          />
        )}
      </Consumer>
    );
  }
  if (process.env.NODE_ENV !== 'production') {
    Wrapper.displayName = `withSchema(${Component.displayName || Component.name})`;
  }
  return Wrapper;
}
