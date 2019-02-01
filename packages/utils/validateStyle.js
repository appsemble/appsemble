import postcss from 'postcss';

export class StyleValidationError extends Error {
  constructor(message) {
    super(message);
    Error.captureStackTrace(this, StyleValidationError);
  }
}

export default function validateStyle(css) {
  if (!css) {
    return null;
  }
  try {
    return postcss.parse(css).toString();
  } catch (error) {
    throw new StyleValidationError(error);
  }
}
