import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cronRateLimiter } from '@/utils/rateLimiter';
import { sanitizeError } from '@/utils/validation';

export const AdminCronButton = () => {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{ successful: number; failed: number; errors: string[] } | null>(null);

  const runCronDaily = async () => {
    if (!cronRateLimiter.canMakeRequest('cron-daily')) {
      toast.error('Please wait before running the cron job again');
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cron-daily', {
        body: { manual: true }
      });

      if (error) {
        toast.error('Failed to run cron job: ' + sanitizeError(error));
        return;
      }

      setLastResult(data);
      toast.success('Cron job completed successfully');
    } catch (error) {
      toast.error('Failed to run cron job: ' + sanitizeError(error));
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