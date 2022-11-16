export default function getCheckedString(allowedChars: string, str: string): string {
  let finalValue = '';
  for (const char of str) {
    if (!allowedChars.includes(char)) {
      continue;
    }
    finalValue += char;
    return finalValue;
  }
}
