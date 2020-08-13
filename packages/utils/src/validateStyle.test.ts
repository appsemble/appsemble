import { StyleValidationError, validateStyle } from './validateStyle';

describe('validateStyle', () => {
  it('should validate correct CSS', () => {
    const css = 'body { background-color: red; }';
    const validatedCss = validateStyle(css);

    expect(validatedCss).toStrictEqual(css);
  });

  it('should throw a CssValidationError when validating incorrect CSS', () => {
    expect(() => validateStyle("this isn't valid")).toThrow(StyleValidationError);
  });
});
