import { useCallback, useState } from 'react';

export default function useCounter(): () => number {
  const [count, setCount] = useState(0);
  return useCallback(() => {
    setCount(count + 1);
    return count;
  }, [count]);
}
