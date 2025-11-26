/**
 * Common Supabase query helpers
 * Provides reusable patterns for database operations with proper error handling
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type SupabaseClientType = SupabaseClient<Database>;

interface QueryOptions {
  retries?: number;
  timeout?: number;
}

/**
 * Execute a Supabase query with error handling and logging
 */
export async function executeQuery<T>(
  operation: string,
  table: string,
  queryFn: (client: SupabaseClientType) => Promise<{ data: T | null; error: unknown }>,
  options: QueryOptions = {}
): Promise<{ data: T | null; error: Error | null }> {
  const { retries = 0, timeout = 10000 } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      logger.query(operation, table, { attempt: attempt + 1 });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Query timeout after ${timeout}ms`)), timeout)
      );

      const queryPromise = queryFn(supabase);
      const result = await Promise.race([queryPromise, timeoutPromise]);

      if (result.error) {
        const error = result.error instanceof Error 
          ? result.error 
          : new Error(String(result.error));
        
        logger.error(`Supabase query error: ${operation}`, error, { table, attempt: attempt + 1 });
        
        // Don't retry on certain errors
        if (attempt < retries && !isNonRetryableError(result.error)) {
          lastError = error;
          continue;
        }
        
        return { data: null, error };
      }

      logger.query(`${operation} (success)`, table, { attempt: attempt + 1 });
      return { data: result.data, error: null };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Query execution error: ${operation}`, err, { table, attempt: attempt + 1 });
      
      if (attempt < retries) {
        lastError = err;
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        continue;
      }
      
      return { data: null, error: err };
    }
  }

  return { data: null, error: lastError };
}

/**
 * Check if an error should not be retried
 */
function isNonRetryableError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as { code?: string; message?: string };
    // Authentication errors, not found, etc. shouldn't be retried
    return ['PGRST116', '23505', '23503'].some(code => 
      errorObj.code?.includes(code) || errorObj.message?.includes(code)
    );
  }
  return false;
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<{ user: { id: string } | null; error: Error | null }> {
  return executeQuery(
    'getUser',
    'auth',
    async (client) => {
      const result = await client.auth.getUser();
      return {
        data: result.data.user ? { id: result.data.user.id } : null,
        error: result.error,
      };
    }
  );
}

/**
 * Safe select query with error handling
 */
export async function safeSelect<T>(
  table: string,
  query: (client: SupabaseClientType) => ReturnType<SupabaseClientType['from']>,
  options: QueryOptions = {}
): Promise<{ data: T[] | null; error: Error | null }> {
  return executeQuery(
    'select',
    table,
    async (client) => {
      const result = await query(client);
      return {
        data: result.data as T[] | null,
        error: result.error,
      };
    },
    options
  );
}

/**
 * Safe insert with error handling
 */
export async function safeInsert<T>(
  table: string,
  data: T[],
  options: QueryOptions = {}
): Promise<{ data: T[] | null; error: Error | null }> {
  return executeQuery(
    'insert',
    table,
    async (client) => {
      const result = await client.from(table).insert(data).select();
      return {
        data: result.data as T[] | null,
        error: result.error,
      };
    },
    options
  );
}

/**
 * Safe update with error handling
 */
export async function safeUpdate<T>(
  table: string,
  updates: Partial<T>,
  filter: (query: ReturnType<SupabaseClientType['from']>) => ReturnType<SupabaseClientType['from']>,
  options: QueryOptions = {}
): Promise<{ data: T[] | null; error: Error | null }> {
  return executeQuery(
    'update',
    table,
    async (client) => {
      const query = client.from(table).update(updates);
      const result = await filter(query).select();
      return {
        data: result.data as T[] | null,
        error: result.error,
      };
    },
    options
  );
}

/**
 * Safe upsert with error handling
 */
export async function safeUpsert<T>(
  table: string,
  data: T[],
  onConflict?: string,
  options: QueryOptions = {}
): Promise<{ data: T[] | null; error: Error | null }> {
  return executeQuery(
    'upsert',
    table,
    async (client) => {
      let query = client.from(table).upsert(data);
      if (onConflict) {
        query = query.onConflict(onConflict);
      }
      const result = await query.select();
      return {
        data: result.data as T[] | null,
        error: result.error,
      };
    },
    options
  );
}
