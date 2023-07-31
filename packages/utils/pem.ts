export function stripPem(pem: string, removeNewlines = false): string {
  return pem
    .replaceAll(/^[\s-]*BEGIN [A-Z]+[\s-]*/g, '')
    .replaceAll(/[\s-]*END [A-Z]+[\s-]*$/g, '')
    .replaceAll(/\r?\n/g, removeNewlines ? '' : '\n')
    .trim();
}

export function wrapPem(pem: string, type: string): string {
  return `-----BEGIN ${type}-----\n${pem}\n-----END ${type}-----`;
}
