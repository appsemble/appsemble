export function parseAddress(address: string | null | undefined): {
  houseNumber: string;
  streetName: string;
} {
  const addressRegex = /^(\d+)(\s?\d*[A-Za-z]?)\s+(.*)$/;

  if (!address) {
    return { houseNumber: '', streetName: '' };
  }

  const match = address.match(addressRegex);

  if (match) {
    return {
      houseNumber: match[1] + match[2],
      streetName: match[3],
    };
  }
  return { houseNumber: '', streetName: '' };
}
