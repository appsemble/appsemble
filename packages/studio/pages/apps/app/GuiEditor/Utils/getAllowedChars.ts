export default function getAllowedChars(
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
