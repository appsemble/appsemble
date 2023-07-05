export function debounce(cb: (...args: any) => void, delay = 1000): (...args: any) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      cb(...args);
    }, delay);
  };
}
