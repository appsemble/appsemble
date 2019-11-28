export default function xmlToJson(src: Element): {} {
  const children = [...((src.children as unknown) as Element[])];

  let result: any = {};

  if (!children.length) {
    if (!src.hasAttributes()) {
      return src.textContent;
    }

    if (src.textContent) {
      result._ = src.textContent;
    }
  }

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];

    const childIsArray =
      children.filter(eachChild => eachChild.nodeName === child.nodeName).length > 1;

    if (childIsArray) {
      result[child.nodeName] = [...(result[child.nodeName] || []), xmlToJson(child)];
    } else {
      result[child.nodeName] = xmlToJson(child);
    }
  }

  if (src.hasAttributes && src.hasAttributes()) {
    const { attributes } = src;
    const output: any = {};

    for (let index = attributes.length - 1; index >= 0; index -= 1) {
      output[attributes[index].name] = attributes[index].value;
    }

    result = { ...output, ...result };
  }

  return result;
}
