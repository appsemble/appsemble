export default function xmlToJson(srcDOM: XMLDocument | Element): {} {
  const children = [...((srcDOM.children as unknown) as Element[])];

  const result: any = {};

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];

    const childIsArray =
      children.filter(eachChild => eachChild.nodeName === child.nodeName).length > 1;

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
