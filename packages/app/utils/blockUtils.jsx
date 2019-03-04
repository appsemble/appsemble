export function normalizeBlockName(name) {
  if (name.startsWith('@')) {
    return name;
  }
  return `@appsemble/${name}`;
}

export function blockToString({ type, version }) {
  return `${normalizeBlockName(type)}@${version}`;
}

export function prefixURL(block, url) {
  return `/api/blocks/${normalizeBlockName(block.type)}/versions/${block.version}/${url}`;
}
