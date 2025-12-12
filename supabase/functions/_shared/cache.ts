/**
 * Simple in-memory cache for Edge Functions
 * Used for caching expensive database queries on static/rarely-changing data
 * 
 * SCALABILITY NOTES:
 * - This cache is per-isolate in Supabase Edge Functions
 * - Each cold start creates a fresh cache
 * - For true distributed caching, use Redis via Upstash
 * - TTL defaults are conservative to avoid stale data issues
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Get data from cache or fetch it
 * @param key - Unique cache key
 * @param fetcher - Async function to fetch data if not cached
 * @param ttlMs - Time to live in milliseconds (default: 5 minutes)
 * @returns Cached or freshly fetched data
 */
export async function getOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 5 * 60 * 1000
): Promise<T> {
  const now = Date.now();
  const cached = cache.get(key) as CacheEntry<T> | undefined;
  
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }
  
  const data = await fetcher();
  cache.set(key, { data, expiresAt: now + ttlMs });
  return data;
}

/**
 * Clear a specific cache entry
 */
export function invalidate(key: string): void {
  cache.delete(key);
}

/**
 * Clear all cache entries matching a prefix
 */
export function invalidatePrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear all cache entries
 */
export function clearAll(): void {
  cache.clear();
}

/**
 * Pre-defined cache keys for common data
 */
export const CacheKeys = {
  ALL_SKILLS: 'skills:all',
  SKILLS_BY_SUBJECT: (subject: string) => `skills:subject:${subject}`,
  LESSON_CONTENT: (skillCode: string) => `lesson:${skillCode}`,
  FORM_QUESTIONS: (formId: string, section: string) => `form:${formId}:${section}`,
  USER_PROFILE: (userId: string) => `profile:${userId}`,
  USER_PREFERENCES: (userId: string) => `prefs:${userId}`,
} as const;

/**
 * TTL values for different data types (in milliseconds)
 */
export const CacheTTL = {
  /** Skills rarely change - cache for 30 minutes */
  SKILLS: 30 * 60 * 1000,
  /** Lesson content rarely changes - cache for 30 minutes */
  LESSONS: 30 * 60 * 1000,
  /** Form questions are static - cache for 1 hour */
  FORMS: 60 * 60 * 1000,
  /** User profile can change - cache for 2 minutes */
  USER_PROFILE: 2 * 60 * 1000,
  /** User preferences change rarely - cache for 5 minutes */
  USER_PREFERENCES: 5 * 60 * 1000,
} as const;
