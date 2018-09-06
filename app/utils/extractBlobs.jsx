/**
 * The symbol which is used as a default replacement for blobs.
 */
export const placeholder = Symbol('resourceFiles.placeholder');


function defaultReplacer() {
  return placeholder;
}


/**
 * Extract blobs from an object.
 *
 * This deeply replaces the blobs in the given object using the return value of the replacer
 * function.
 *
 * @param {Object} object The object whose blobs to replace.
 * @param {Function<Blob>} replacer The function which should be used to determine what to replace a
 * blob by.
 * @returns {Array<Object,Array<Blob>>} An array whose first element is the object with the blobs
 * replaced, and the second argument an array of all extracted blobs.
 */
export default function extractBlobs(object, replacer = defaultReplacer) {
  let result;
  const files = [];
  if (object instanceof Blob) {
    files.push(object);
    result = replacer(object);
  } else if (Array.isArray(object)) {
    result = object.map((value) => {
      const [nestedResult, nestedFiles] = extractBlobs(value, replacer);
      files.push(...nestedFiles);
      return nestedResult;
    });
  } else if (object instanceof Object) {
    result = Object.entries(object)
      .reduce((acc, [key, value]) => {
        const [nestedResult, nestedFiles] = extractBlobs(value, replacer);
        files.push(...nestedFiles);
        acc[key] = nestedResult;
        return acc;
      }, {});
  } else {
    result = object;
  }
  return [result, files];
}
