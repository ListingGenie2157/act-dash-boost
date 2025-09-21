// src/components/AdminCronButton.tsx
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type CronResult = { successful: number; failed: number; errors: string[] };

export const AdminCronButton = () => {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<CronResult | null>(null);
  const invokeCounterRef = useRef(0);

  async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), ms);
    try {
      // @supabase/supabase-js picks up AbortSignal via fetch internally if needed
      // For functions.invoke we race manually
      const timeout = new Promise<never>((_, rej) => c.signal.addEventListener("abort", () => rej(new Error("Request timed out")), { once: true }));
      return (await Promise.race([p, timeout])) as T;
    } finally {
      clearTimeout(t);
    }
  }

  async function invokeWithRetry<T>(
    fnName: string,
    body: unknown,
    opts: { retries?: number; timeoutMs?: number } = {}
  ): Promise<T> {
    const retries = opts.retries ?? 2;
    const timeoutMs = opts.timeoutMs ?? 10000;

    let attempt = 0;
    let lastErr: unknown;

    while (attempt <= retries) {
      try {
        const { data, error } = await withTimeout(
          supabase.functions.invoke<T>(fnName, { method: "POST", body }),
          timeoutMs
        );
        if (error) throw error;
        return data as T;
      } catch (err) {
        lastErr = err;
        if (attempt === retries) break;
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt))); // 500ms, 1s, 2s
        attempt += 1;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error("Unknown error");
  }

  const runCronDaily = async () => {
    if (loading) return; // concurrency guard
    setLoading(true);
    try {
      const invocationId = ++invokeCounterRef.current;
      const data = await invokeWithRetry<CronResult>("cron-daily", { manual: true });
      if (invokeCounterRef.current !== invocationId) return; // stale response
      setLastResult(data);
      toast.success("Cron job completed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to run cron job");
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
        <Button onClick={runCronDaily} disabled={loading} className="w-full">
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
