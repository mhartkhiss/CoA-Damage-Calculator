import { useState, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      setStoredValue(prevValue => {
        const valueToStore = value instanceof Function ? value(prevValue) : value;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        return valueToStore;
      });
    } catch (error) {
      console.log(error);
    }
  }, [key]);

  return [storedValue, setValue] as const;
}

export function useLocalStorageInputs<T extends object>(keys: (keyof T)[], initialValues: T) {
  const [values, setValues] = useState<T>(() => {
    const result = { ...initialValues };
    keys.forEach(key => {
      try {
        const item = window.localStorage.getItem(key as string);
        if (item !== null) {
          result[key] = JSON.parse(item);
        }
      } catch (error) {
        console.log(`Error loading ${key as string} from localStorage:`, error);
      }
    });
    return result;
  });

  const updateValue = useCallback((key: keyof T, value: T[keyof T]) => {
    setValues(prev => {
      const newValues = { ...prev, [key]: value };
      try {
        if (keys.includes(key)) {
          window.localStorage.setItem(key as string, JSON.stringify(value));
        }
      } catch (error) {
        console.log(`Error saving ${key as string} to localStorage:`, error);
      }
      return newValues;
    });
  }, [keys]);

  const resetValues = useCallback(() => {
    const result = { ...initialValues };
    setValues(result);
    keys.forEach(key => {
      try {
        window.localStorage.removeItem(key as string);
      } catch (error) {
        console.log(`Error removing ${key as string} from localStorage:`, error);
      }
    });
  }, [initialValues, keys]);

  return [values, updateValue, setValues, resetValues] as const;
}
