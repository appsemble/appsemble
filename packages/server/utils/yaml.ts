import { type Transaction } from 'sequelize';
import { type Promisable } from 'type-fest';
import { Alias, type Document, Scalar, YAMLMap, YAMLSeq } from 'yaml';

export type Segment = RegExp | number | string;
export type Path = Segment[];

/**
 * A patch is based on a single path.
 *
 * The path is either used to perform an operation on, such as removing or replacing its value.
 * And/Or to use its value in an operation elsewhere.
 */
export interface Patch {
  /**
   * A message representing the patch.
   */
  message: string;

  /**
   * The path to be patched.
   *
   * A path item must be of type {@link Segment}
   *
   * Items can be a number, string literal, or regex pattern.
   *
   * Special item values:
   * - `'*'`: a wildcard, which continues the search until the next value is matched.
   * Note: a wildcard should not be used at the end of a path.
   * - `'<'`: a back reference going back 1 step from where the search continues.
   */
  path: Path;

  /**
   * Whether to add the value to a pair or sequence.
   *
   * @default false
   */
  add?: boolean;

  /**
   * Whether to delete the key value pair.
   *
   * @default false
   */
  delete?: boolean;

  /**
   * The value to apply.
   *
   * By default replaces the current value.
   *
   * If you would like to add a new key to a kv pair return in {@link value}:
   *
   * `{ key: 'mykey', value: 'myvalue' }`
   *
   * **Note**: you may need to wrap the key with `new Scalar('myKey')`, if you plan to access the
   * value by key.
   *
   * And if you would like to add a new collection use:
   *
   * `new YAMLSeq()`
   *
   * **Note**: you _MUST_ use a callback whenever creating an instance of `YAMLMap`, `YAMLSeq` or
   * `Scalar`, because the value would otherwise be used in multiple document branches.
   */
  value?:
    | unknown
    | ((path: Path, transaction: Transaction, ...params: unknown[]) => Promisable<unknown>);

  /**
   * Additional paths to be patched.
   */
  patches?: ((
    document: Document,
    transaction: Transaction,
    stepsList: Path[],
  ) => Promisable<void>)[];
}

const isLast = (index: number, length: number): boolean => index === length - 1;

function isMatch(input: unknown, matcher: Segment): boolean {
  return input === matcher || (matcher instanceof RegExp && matcher.test(String(input)));
}

function recurse(
  root: YAMLMap,
  node: unknown,
  main: Path,
  index: number,
  anchors: string[],
  handledAnchors: Set<string>,
  resolving: Path = [],
): Path[] {
  const output: Path[] = [];
  const matcher = main[index];
  const last = isLast(index, main.length);

  if (node instanceof YAMLMap) {
    for (const pair of node.items) {
      if (isMatch(pair.key.value, matcher)) {
        output.push([...resolving, pair.key.value]);
      } else {
        for (const path of recurse(root, pair.value, main, index, anchors, handledAnchors, [
          ...resolving,
          pair.key.value,
        ])) {
          output.push(path);
        }
      }
    }
  } else if (node instanceof YAMLSeq) {
    for (const [i, item] of node.items.entries()) {
      output.push(...recurse(root, item, main, index, anchors, handledAnchors, [...resolving, i]));
    }
  } else if (node instanceof Scalar && last && isMatch(node.value, matcher)) {
    output.push([...resolving, node.value]);
  } else if (node instanceof Alias && !handledAnchors.has(node.source)) {
    const anchor = ['anchors', anchors.indexOf(node.source)];
    output.push(
      ...recurse(root, root.getIn(anchor, true), main, index, anchors, handledAnchors, anchor),
    );
    handledAnchors.add(node.source);
  }

  return output;
}

function handleLastAlias(
  root: YAMLMap,
  anchor: Path,
  main: Path,
  index: number,
  anchors: string[],
  handledAnchors: Set<string>,
): Path[] {
  const output: Path[] = [];
  const node = root.getIn(anchor, true);
  if (node instanceof Scalar && isMatch(node.value, main[index])) {
    return [[...anchor, node.value]];
  }
  if (node instanceof YAMLMap) {
    const pairs = node.items.filter((pair) => isMatch(pair.key.value, main[index]));
    return pairs.map(({ key }) => [...anchor, key.value]);
  }
  if (node instanceof YAMLSeq) {
    return node.items.filter((item, i) => isMatch(i, main[index])).map((v, i) => [...anchor, i]);
  }
  if (node instanceof Alias && !handledAnchors.has(node.source)) {
    anchors.push(node.source);
    return handleLastAlias(root, anchor, main, index, anchors, handledAnchors);
  }
  return output;
}

/**
 * Collects the paths and steps matching the {@link Patch.path}.
 *
 * @param main The path of the patch to resolve matching paths for.
 * @param root The root of the document.
 * @param node The current node to walk over.
 * @param anchors The anchors present in the app.
 * @param handledAnchors The already searched anchors.
 * @param index The index of the {@link main} path.
 * @param resolvingPaths The paths to be resolved.
 * @param resolvingSteps The steps it took to resolve the paths.
 * @returns A tuple of resolved paths plus the resolved list of steps.
 */
export function collectPaths(
  main: Path,
  root: YAMLMap,
  node: unknown = root,
  anchors = (root.get('anchors') as YAMLSeq<Scalar | YAMLMap | YAMLSeq>)?.items
    .map(({ anchor }) => anchor)
    .filter((anchor) => anchor !== undefined) ?? [],
  handledAnchors = new Set<string>(),
  index = 0,
  // TODO: should be able to separate paths from steps in another function
  resolvingPaths: Path = [],
  resolvingSteps: Path = [],
): [Path[], Path[]] {
  const paths: Path[] = [];
  const steps: Path[] = [];
  let back = false;

  const collect = (input: Segment): void => {
    paths.push([...resolvingPaths, input]);
    steps.push([...resolvingSteps, input]);
  };

  if (main[index] === '<') {
    back = true;
    paths.push(isLast(index, main.length) ? resolvingPaths.slice(0, -1) : resolvingPaths);
    steps.push(resolvingSteps);
  } else if (main[index] === '*') {
    // eslint-disable-next-line no-param-reassign
    index += 1;
    // TODO: Currently ending with * is not supported as this would cause out of bounds issues....
    const recursed = recurse(root, node, main, index, anchors, handledAnchors, resolvingPaths);
    paths.push(...recursed);
    steps.push(
      ...recursed.map((path) => (path[0] === 'anchors' ? [...resolvingSteps, ...path] : path)),
    );
  } else {
    // TODO: see if ordering these to scalar > yamlmap > yamlseq > alias is faster
    if (node instanceof YAMLMap) {
      const pairs = node.items.filter((pair) => isMatch(pair.key.value, main[index]));
      for (const pair of pairs) {
        collect(pair.key.value);
      }
    } else if (node instanceof YAMLSeq) {
      for (const [number] of node.items.filter((item, i) => isMatch(i, main[index])).entries()) {
        collect(number);
      }
    } else if (
      node instanceof Scalar &&
      (main?.[index + 1] || isLast(index, main.length)) &&
      isMatch(node.value, main[index])
    ) {
      collect(node.value);
    } else if (node instanceof Alias && !handledAnchors.has(node.source)) {
      const anchor = ['anchors', anchors.indexOf(node.source)];
      if (isLast(index, main.length)) {
        const output = handleLastAlias(root, anchor, main, index, anchors, handledAnchors);
        paths.push(...output);
        steps.push(...output.map((a) => [...resolvingSteps, ...a]));
      }
      // TODO: does this make sense?? what about matching??
      else {
        paths.push(anchor);
        steps.push([...resolvingSteps, ...anchor]);
      }
      handledAnchors.add(node.source);
    }
  }

  if (isLast(index, main.length)) {
    return [paths, steps];
  }

  const pathOutputs: Path[] = [];
  const stepOutputs: Path[] = [];
  for (const [i, entry] of paths.entries()) {
    const resolving = back ? entry.slice(0, -1) : entry;
    // TODO: consider passing without scalar true to refactor stuff
    const base = root.getIn(resolving, true);
    const [path, step] = collectPaths(
      main,
      root,
      base,
      anchors,
      handledAnchors,
      index + 1,
      resolving,
      steps[i],
    );
    pathOutputs.push(...path);
    stepOutputs.push(...step);
  }

  return [pathOutputs, stepOutputs];
}
