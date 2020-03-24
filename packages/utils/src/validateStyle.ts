import postcss from 'postcss';

export class StyleValidationError extends Error {}

export default function validateStyle(css: postcss.ParserInput): string {
  if (!css) {
    return null;
  }
  try {
    return postcss.parse(css).toString();
  } catch (error) {
    throw new StyleValidationError(error);
  }
}
