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

it('should set unknown properties as attributes', () => {
  const div = <div aria-busy />;
  expect(div.getAttribute('aria-busy')).toBe('true');
});

it('render element children', () => {
  const div = (
    <div>
      <figure>
        <img alt="test" />
      </figure>
      <span />
    </div>
  );
  expect(div.outerHTML).toBe('<div><figure><img alt="test"></figure><span></span></div>');
});

it('render string children', () => {
  const div = <div>Hello world!</div>;
  expect(div.outerHTML).toBe('<div>Hello world!</div>');
});

it('render number children', () => {
  const div = <div>{42}</div>;
  expect(div.outerHTML).toBe('<div>42</div>');
});

it('ignore boolean or null children', () => {
  const div = (
    <div>
      {true}
      {false}
      {null}
      {undefined}
    </div>
  );
  expect(div.outerHTML).toBe('<div></div>');
});
