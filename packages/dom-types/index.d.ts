export interface HTMLEvent<T extends Element = HTMLElement> extends Event {
  currentTarget: T;
  target: T;
}
