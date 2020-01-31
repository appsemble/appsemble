export default function normalizeBlockName(name) {
  if (name.startsWith('@')) {
    return name;
  }
  return `@appsemble/${name}`;
}
