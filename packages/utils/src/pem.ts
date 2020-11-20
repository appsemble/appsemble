export function stripPem(pem: string, removeNewlines = false): string {
  return pem
    .replace(/^[\s-]*BEGIN [A-Z]+[\s-]*/g, '')
    .replace(/[\s-]*END [A-Z]+[\s-]*$/g, '')
    .replace(/\r?\n/g, removeNewlines ? '' : '\n')
    .trim();
}

export function wrapPem(pem: string, type: string): string {
  return `-----BEGIN ${type}-----\n${pem}\n-----END ${type}-----`;
}
