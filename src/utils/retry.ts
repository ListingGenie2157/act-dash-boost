interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  shouldRetry?: (error: unknown) => boolean;
}

const defaultOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  shouldRetry: (error) => {
    // Don't retry on client errors (4xx)
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('400') || 
          message.includes('401') || 
          message.includes('403') || 
          message.includes('404')) {
        return false;
      }
    }
    return true;
  }
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: unknown;
  let delay = opts.initialDelay;
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === opts.maxAttempts || !opts.shouldRetry(error)) {
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Calculate next delay
      delay = Math.min(delay * opts.backoffFactor, opts.maxDelay);
    }
  }
  
  throw lastError;
}

// Wrapper for Supabase functions with retry
export async function invokeWithRetry<T>(
  functionName: string,
  options?: { body?: any; method?: string },
  retryOptions?: RetryOptions
): Promise<T> {
  const { supabase } = await import('@/integrations/supabase/client');
  
  return withRetry(async () => {
    const { data, error } = await supabase.functions.invoke<T>(
      functionName,
      options
    );
    
    if (error) throw error;
    if (!data) throw new Error('No data returned');
    
    return data;
  }, retryOptions);
}