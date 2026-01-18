/**
 * Web Vitals Monitoring
 * Core Web Vitals 성능 측정 및 리포팅
 *
 * 목표:
 * - LCP < 2.5s (Largest Contentful Paint)
 * - FID < 100ms (First Input Delay)
 * - CLS < 0.1 (Cumulative Layout Shift)
 * - INP < 200ms (Interaction to Next Paint)
 */

import { logger } from './logger';

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

// 성능 등급 기준
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  TTFB: { good: 800, poor: 1800 },
  FCP: { good: 1800, poor: 3000 },
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

// 성능 데이터 저장
const vitalsData: Record<string, WebVitalsMetric> = {};

/**
 * Web Vitals 측정 결과 처리
 */
function handleMetric(metric: { name: string; value: number; delta: number; id: string }) {
  const rating = getRating(metric.name, metric.value);

  const data: WebVitalsMetric = {
    name: metric.name,
    value: metric.value,
    rating,
    delta: metric.delta,
    id: metric.id,
  };

  vitalsData[metric.name] = data;

  // 개발 환경에서 로깅
  const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
  logger.log(
    `${emoji} [Web Vitals] ${metric.name}: ${metric.value.toFixed(2)} (${rating})`
  );

  // 성능 문제 경고
  if (rating === 'poor') {
    logger.warn(`[Performance Warning] ${metric.name} is poor: ${metric.value.toFixed(2)}`);
  }
}

/**
 * Web Vitals 측정 시작
 * 동적 import로 번들 크기 영향 최소화
 */
export async function initWebVitals() {
  if (typeof window === 'undefined') return;

  try {
    // web-vitals 동적 import
    const { onLCP, onFID, onCLS, onINP, onTTFB, onFCP } = await import('web-vitals');

    // Core Web Vitals
    onLCP(handleMetric);
    onFID(handleMetric);
    onCLS(handleMetric);
    onINP(handleMetric);

    // Additional metrics
    onTTFB(handleMetric);
    onFCP(handleMetric);

    logger.log('[Web Vitals] Monitoring initialized');
  } catch (error) {
    logger.error('[Web Vitals] Failed to initialize:', error);
  }
}

/**
 * 현재까지 수집된 Web Vitals 데이터 반환
 */
export function getWebVitalsData(): Record<string, WebVitalsMetric> {
  return { ...vitalsData };
}

/**
 * Web Vitals 요약 리포트 생성
 */
export function getWebVitalsReport(): string {
  const metrics = Object.values(vitalsData);
  if (metrics.length === 0) return 'No Web Vitals data collected yet.';

  const report = metrics
    .map((m) => {
      const emoji = m.rating === 'good' ? '✅' : m.rating === 'needs-improvement' ? '⚠️' : '❌';
      return `${emoji} ${m.name}: ${m.value.toFixed(2)} (${m.rating})`;
    })
    .join('\n');

  return `=== Web Vitals Report ===\n${report}`;
}
