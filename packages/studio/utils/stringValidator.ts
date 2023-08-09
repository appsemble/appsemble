export function getCheckedString(allowedChars: RegExp, str: string): string {
  let finalValue = '';
  for (const char of str) {
    if (allowedChars.test(char)) {
      finalValue += char;
    }
  }
  return finalValue;
}

export function getAllowedChars(
  allowSpace: boolean,
  allowSymbols: boolean,
  allowNumbers: boolean,
  allowUpperChars: boolean,
): RegExp {
  const allowed = '[a-z]'.concat(
    allowSpace ? '|[ ]' : '',
    allowSymbols ? '|([^A-Z|\\d|a-z| ])' : '',
    allowNumbers ? '|\\d' : '',
    allowUpperChars ? '|[A-Z]' : '',
  );
  return new RegExp(`^(${allowed})*$`);
}
