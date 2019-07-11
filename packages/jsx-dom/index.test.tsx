/* @jsx h */
import h from '.';

it('should assign properties', () => {
  const button = <button className="is-primary" type="button" />;
  expect(button).toBeInstanceOf(HTMLButtonElement);
  expect(button.className).toBe('is-primary');
});

it('should add event handlers', () => {
  const handler = jest.fn();
  const button = <button onclick={handler} type="button" />;
  button.dispatchEvent(new Event('click'));
  expect(handler).toHaveBeenCalledTimes(1);
});

it('should render a function that returns a tag', () => {
  function Foo({ cls }: { cls: string }): HTMLDivElement {
    return <div className={cls} /> as HTMLDivElement;
  }

  const foo = <Foo cls="foo" />;
  expect(foo.tagName).toBe('DIV');
  expect(foo.className).toBe('foo');
});
