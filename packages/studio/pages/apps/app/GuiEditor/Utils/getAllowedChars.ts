export default function getAllowedChars(
  allowSpace: boolean,
  allowSymbols: boolean,
  allowNumbers: boolean,
  allowUpperChars: boolean,
): string {
  let defaultChars = 'abcdefghijklmnopqrstuvwxyz';
  if (allowSpace) {
    defaultChars += ' ';
  }
  if (allowSymbols) {
    defaultChars += '!@#$%^&*()_+-=[]{};:,./<>?';
  }
  if (allowNumbers) {
    defaultChars += '0123456789';
  }
  if (allowUpperChars) {
    defaultChars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  }
  return defaultChars;
}
