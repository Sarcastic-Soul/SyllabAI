/**
 * A minimal concurrency limiter (like p-limit) to avoid adding a dependency.
 * Limits the number of concurrent async operations.
 */
export function pLimit(concurrency: number) {
  let activeCount = 0;
  const queue: (() => void)[] = [];

  const next = () => {
    if (queue.length > 0 && activeCount < concurrency) {
      activeCount++;
      const run = queue.shift()!;
      run();
    }
  };

  return <T>(fn: () => Promise<T>): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const run = () => {
        fn()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            activeCount--;
            next();
          });
      };

      if (activeCount < concurrency) {
        activeCount++;
        run();
      } else {
        queue.push(run);
      }
    });
  };
}
