
import { useState, useCallback } from 'react';

/**
 * A custom hook for managing boolean state with convenient setter functions
 */
export const useBoolean = (initialValue: boolean = false) => {
  const [value, setValue] = useState(initialValue);

  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  const toggle = useCallback(() => setValue(prev => !prev), []);

  return { value, setValue, setTrue, setFalse, toggle };
};

export default useBoolean;
