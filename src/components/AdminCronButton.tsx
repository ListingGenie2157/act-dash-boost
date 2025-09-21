import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const AdminCronButton = () => {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{ successful: number; failed: number; errors: string[] } | null>(null);
  const invokeCounterRef = useRef(0);

  async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Request timed out')), ms);
    });
    try {
      const result = await Promise.race([promise, timeoutPromise]);
      return result as T;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  async function invokeWithRetry<T>(fnName: string, body: unknown, { retries = 2, timeoutMs = 10000 }: { retries?: number; timeoutMs?: number } = {}): Promise<T> {
    let attempt = 0;
    let lastErr: unknown;
    while (attempt <= retries) {
      try {
        const { data, error } = await withTimeout(supabase.functions.invoke<T>(fnName, { method: 'POST', body }), timeoutMs);
        if (error) throw error;
        return data as T;
      } catch (err) {
        lastErr = err;
        // Backoff: 500ms, 1000ms, 2000ms
        const backoff = 500 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, backoff));
        attempt += 1;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error('Unknown error');
  }

  const runCronDaily = async () => {
    if (loading) return; // Concurrency guard
    setLoading(true);
    try {
      // Track invocation id to avoid race updates
      const invocationId = ++invokeCounterRef.current;
      const data = await invokeWithRetry<{ successful: number; failed: number; errors: string[] }>('cron-daily', { manual: true });
      if (invokeCounterRef.current !== invocationId) return; // stale response
      setLastResult(data);
      toast.success('Cron job completed');
      console.debug('Cron job result summary:', { successful: data?.successful, failed: data?.failed, errorsCount: data?.errors?.length ?? 0 });
    } catch (error) {
      console.error('Error calling cron function:', error);
      toast.error('Failed to run cron job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="w-5 h-5" />
          Manual Cron Trigger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runCronDaily} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Run Cron Daily
            </>
          )}
        </Button>
        
        {lastResult && (
          <div className="text-sm space-y-2">
            <p className="font-medium">Last Result:</p>
            <div className="bg-muted p-2 rounded text-xs">
              <pre>{JSON.stringify(lastResult, null, 2)}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};