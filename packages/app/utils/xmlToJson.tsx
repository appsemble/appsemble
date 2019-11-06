export default function xmlToJson(src: XMLDocument | Element): {} {
  const children = [...((src.children as unknown) as Element[])];

  const result: any = {};

  if (!children.length) {
    return src.textContent;
  }

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];

    const childIsArray =
      children.filter(eachChild => eachChild.nodeName === child.nodeName).length > 1;

    // XXX: Consider also checking for attributes and converting that to an object as well
    if (childIsArray) {
      if (result[child.nodeName] === undefined) {
        result[child.nodeName] = [xmlToJson(child)];
      } else {
        result[child.nodeName].push(xmlToJson(child));
      }
    } else {
      result[child.nodeName] = xmlToJson(child);
    }
  }

  return result;
}
