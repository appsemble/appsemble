declare module '*.css' {
  type IClassNames = Record<string, string>;
  const classNames: IClassNames;
  export = classNames;
}
