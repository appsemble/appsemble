declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    type Element = HTMLElement;

    type IntrinsicElements = {
      [K in keyof HTMLElementTagNameMap]: Partial<HTMLElementTagNameMap[K]>;
    };
  }
}

interface Props {
  [prop: string]: any;
}

type Child = boolean | number | string | Node | Children;

// This is a workaround for https://github.com/microsoft/TypeScript/issues/6230
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Children extends Array<Child> {}

function appendChildren(node: Node, children: Child): void {
  if (Array.isArray(children)) {
    children.forEach(child => {
      appendChildren(node, child);
    });
  } else if (children !== null && children !== true && children !== false) {
    node.appendChild(
      typeof children === 'string' || typeof children === 'number'
        ? document.createTextNode(`${children}`)
        : children,
    );
  }
}

/**
 * Create a DOM node using a JSX compatible function.
 *
 * @param tag The HTML tag name of the DOM node to create, or a function that returns a DOM node.
 * @param props Properties to assign to the DOM node or props to pass to the tag function.
 * @param children DOM nodes to append to the newly created DOM node. These may also be strings or
 *   numbers. If a boolean or `null` is passed, the value is ignored.
 *
 * @returns The created DOM node.
 */
export default <T extends keyof HTMLElementTagNameMap>(
  tag: T | ((props: Props) => HTMLElementTagNameMap[T]),
  props: Props = {},
  ...children: Children
): HTMLElementTagNameMap[T] => {
  const node =
    typeof tag === 'string' ? Object.assign(document.createElement(tag), props) : tag(props);
  appendChildren(node, children);
  return node;
};
