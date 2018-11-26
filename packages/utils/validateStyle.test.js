import validateStyle, { StyleValidationError } from './validateStyle';

describe('validateStyle', () => {
  it('should validate correct CSS', () => {
    const css = 'body { background-color: red; }';
    const validatedCss = validateStyle(css);

    expect(validatedCss).toStrictEqual(css);
  });

  it('should validated correct CSS from a buffer', () => {
    const input = 'body { background-color: blue; }';
    const css = Buffer.from(input, 'utf8');
    const validatedCss = validateStyle(css);

    expect(validatedCss).toStrictEqual(input);
  });

  it('should throw a CssValidationError when validating incorrect CSS', () => {
    expect(() => validateStyle("this isn't valid")).toThrow(StyleValidationError);
  });
});
