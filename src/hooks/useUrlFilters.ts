import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * URL 쿼리 파라미터를 사용한 필터 상태 관리 훅
 * 필터 상태를 URL에 반영하여 공유 및 브라우저 네비게이션 지원
 */

export type FilterValue = string | string[] | undefined;

export interface FilterConfig<T extends Record<string, FilterValue>> {
  /** 기본값 */
  defaults: T;
  /** 빈 값으로 취급할 값들 (URL에서 제거됨) */
  emptyValues?: (string | undefined)[];
}

export function useUrlFilters<T extends Record<string, FilterValue>>(
  config: FilterConfig<T>
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { defaults, emptyValues = ['', 'all', undefined] } = config;

  // defaults를 JSON 문자열로 변환하여 안정적인 비교 수행
  const defaultsKey = JSON.stringify(defaults);

  // URL에서 현재 필터 값 읽기
  const filters = useMemo(() => {
    const result = { ...defaults } as T;

    Object.keys(defaults).forEach((key) => {
      const defaultValue = defaults[key as keyof T];

      if (Array.isArray(defaultValue)) {
        // 배열 값: 쉼표로 구분된 문자열을 배열로 변환
        const paramValue = searchParams.get(key);
        if (paramValue) {
          (result as Record<string, FilterValue>)[key] = paramValue.split(',').filter(Boolean);
        }
      } else {
        // 단일 값
        const paramValue = searchParams.get(key);
        if (paramValue !== null) {
          (result as Record<string, FilterValue>)[key] = paramValue;
        }
      }
    });

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, defaultsKey]);

  // 단일 필터 값 설정
  const setFilter = useCallback(
    (key: keyof T, value: FilterValue) => {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);

          // 빈 값이면 파라미터 제거
          if (
            value === undefined ||
            value === null ||
            emptyValues.includes(value as string) ||
            (Array.isArray(value) && value.length === 0)
          ) {
            newParams.delete(key as string);
          } else if (Array.isArray(value)) {
            // 배열 값: 쉼표로 구분된 문자열로 저장
            newParams.set(key as string, value.join(','));
          } else {
            newParams.set(key as string, value);
          }

          return newParams;
        },
        { replace: true }
      );
    },
    [setSearchParams, emptyValues]
  );

  // 여러 필터 값 한번에 설정
  const setFilters = useCallback(
    (updates: Partial<T>) => {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);

          Object.entries(updates).forEach(([key, value]) => {
            if (
              value === undefined ||
              value === null ||
              emptyValues.includes(value as string) ||
              (Array.isArray(value) && (value as string[]).length === 0)
            ) {
              newParams.delete(key);
            } else if (Array.isArray(value)) {
              newParams.set(key, (value as string[]).join(','));
            } else {
              newParams.set(key, value as string);
            }
          });

          return newParams;
        },
        { replace: true }
      );
    },
    [setSearchParams, emptyValues]
  );

  // 모든 필터 초기화
  const resetFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  // 특정 필터들만 초기화
  const resetFilter = useCallback(
    (key: keyof T) => {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.delete(key as string);
          return newParams;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // 현재 URL 쿼리 문자열 (공유용)
  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        !emptyValues.includes(value as string) &&
        !(Array.isArray(value) && value.length === 0)
      ) {
        if (Array.isArray(value)) {
          params.set(key, value.join(','));
        } else {
          params.set(key, value);
        }
      }
    });

    const str = params.toString();
    return str ? `?${str}` : '';
  }, [filters, emptyValues]);

  return {
    filters,
    setFilter,
    setFilters,
    resetFilters,
    resetFilter,
    queryString,
  };
}

/**
 * 간단한 단일 필터 훅
 */
export function useUrlFilter(key: string, defaultValue = '') {
  const [searchParams, setSearchParams] = useSearchParams();

  const value = searchParams.get(key) ?? defaultValue;

  const setValue = useCallback(
    (newValue: string) => {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          if (!newValue || newValue === 'all') {
            newParams.delete(key);
          } else {
            newParams.set(key, newValue);
          }
          return newParams;
        },
        { replace: true }
      );
    },
    [key, setSearchParams]
  );

  return [value, setValue] as const;
}
