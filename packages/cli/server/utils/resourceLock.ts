const queues = new Map<string, Promise<unknown>>();

/**
 * Serialize file-backed resource operations against the same (type, id) pair so
 * the read-then-write pattern used by `updateAppResource`/`deleteAppResource`
 * cannot interleave with a concurrent writer.
 *
 * @param type Resource type, used as part of the lock key.
 * @param id Resource id, used as part of the lock key.
 * @param fn Async operation to run while holding the lock.
 * @returns The resolved value of `fn`.
 */
export function withResourceLock<T>(
  type: string,
  id: number | string,
  fn: () => Promise<T>,
): Promise<T> {
  const key = `${type}#${id}`;
  const previous = queues.get(key) ?? Promise.resolve();
  const next = previous.then(fn, fn);
  queues.set(
    key,
    next.finally(() => {
      if (queues.get(key) === next) {
        queues.delete(key);
      }
    }),
  );
  return next;
}
