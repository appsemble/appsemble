export default function getCheckedString(allowedChars: RegExp, str: string): string {
  let finalValue = '';
  for (const char of str) {
    if (allowedChars.test(char)) {
      finalValue += char;
    }
  }
  return finalValue;
}
