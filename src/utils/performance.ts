import { useEffect, useRef, useCallback } from 'react';

/**
 * Performance monitoring utilities
 */

/**
 * Measure component render time
 * @param componentName - Name of the component being measured
 */
export const useRenderTime = (componentName: string) => {
  const renderStart = useRef<number>(performance.now());

  useEffect(() => {
    const renderTime = performance.now() - renderStart.current;
    if (renderTime > 16) { // Longer than one frame (60fps)
      console.warn(`[Performance] ${componentName} took ${renderTime.toFixed(2)}ms to render`);
    }
  });
};

/**
 * Debounce function to limit execution frequency
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function to limit execution frequency
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Hook to detect and log slow renders
 */
export const usePerformanceMonitor = () => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current++;
    const now = performance.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    
    if (timeSinceLastRender < 50 && renderCount.current > 10) {
      console.warn('[Performance] Rapid re-rendering detected');
    }
    
    lastRenderTime.current = now;
  });
};

/**
 * Measure function execution time
 * @param fn - Function to measure
 * @param label - Label for logging
 */
export const measureTime = async <T,>(
  fn: () => Promise<T>,
  label: string
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[Performance] ${label} failed after ${duration.toFixed(2)}ms`);
    throw error;
  }
};

/**
 * Hook for lazy loading components
 */
export const useLazyLoad = (
  callback: () => void,
  options: IntersectionObserverInit = {}
) => {
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
            observer.unobserve(element);
          }
        });
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [callback, options]);

  return elementRef;
};

/**
 * Web Vitals monitoring
 */
export const reportWebVitals = (metric: any) => {
  if (metric.label === 'web-vital') {
    console.log(`[Web Vital] ${metric.name}: ${metric.value}`);
    
    // Send to analytics service if needed
    // Example: analytics.track('web-vital', metric);
  }
};