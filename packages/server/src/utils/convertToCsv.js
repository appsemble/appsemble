export default function convertToCsv(body) {
  let obj;

  if (typeof body === 'object') {
    obj = body;
  } else {
    try {
      obj = JSON.parse(body);
    } catch (e) {
      return '';
    }
  }

  if (Object(obj) !== obj) {
    // don’t parse primitives
    return '';
  }

  const data = Array.isArray(obj) ? obj : [obj];
  const separator = ',';
  const lineEnd = '\r\n';
  const quote = '"';

  if (!Object.keys(obj).length) {
    // no data to convert, do nothing
    return '';
  }

  const headers = Array.from(
    data.reduce((acc, object) => {
      Object.keys(object).forEach(key => {
        acc.add(key);
      });
      return acc;
    }, new Set()),
  );
  let result = headers.join(separator) + lineEnd;

  data.forEach((object, index) => {
    const values = headers.map(header => {
      let value = object[header];
      if (value == null) {
        return '';
      }

      if (value !== Object(value)) {
        // value is primitive
        value = `${object[header]}`;
      } else {
        // value is not a primitive
        value = JSON.stringify(object[header]);
      }

      if (value.includes(separator) || value.includes(lineEnd) || value.includes('"')) {
        value = `${quote}${value.replace(new RegExp(quote, 'g'), `${quote}${quote}`)}${quote}`;
      }

      return value;
    });

    result += `${values.join(separator)}${index === data.length - 1 ? '' : lineEnd}`;
  });

  return result;
}
