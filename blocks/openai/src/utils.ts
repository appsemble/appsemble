export function isHTML(str: string): boolean {
  const regex = /<[^>]+>/;
  return regex.test(str);
}
