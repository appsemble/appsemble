type Foo<T extends keyof HTMLElementTagNameMap> = HTMLElementTagNameMap[T]['onclick'] extends object
  ? true
  : false;

type Bar = Foo<'div'>;
