/**
 * useDebounce Hooks
 *
 * 디바운싱 유틸리티 훅: 값 디바운싱 및 콜백 디바운싱
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * 값 디바운싱 훅
 * 입력 값이 변경된 후 지정된 지연 시간이 지나야 반환 값이 업데이트됩니다.
 *
 * @param value - 디바운싱할 값
 * @param delay - 지연 시간 (ms), 기본값 300
 * @returns 디바운싱된 값
 *
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 300);
 *
 * useEffect(() => {
 *   // debouncedSearch가 변경될 때만 API 호출
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 콜백 디바운싱 훅
 * 콜백 함수가 마지막 호출 후 지정된 지연 시간이 지나야 실행됩니다.
 *
 * @param callback - 디바운싱할 콜백 함수
 * @param delay - 지연 시간 (ms), 기본값 300
 * @returns 디바운싱된 콜백 함수
 *
 * @example
 * const debouncedSave = useDebouncedCallback((data) => {
 *   api.save(data);
 * }, 500);
 *
 * // 빠르게 연속 호출해도 마지막 호출만 실행됨
 * debouncedSave(formData);
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 최신 콜백 참조 유지
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  return useMemo(() => debouncedFn, [debouncedFn]);
}
