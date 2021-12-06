import postcss from 'postcss';

export class StyleValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StyleValidationError';
  }
}

export function validateStyle(css: unknown): string {
  if (!css) {
    return null;
  }
  try {
    return String(postcss.parse(css));
  } catch (error: unknown) {
    throw new StyleValidationError(error as string);
  }
}
