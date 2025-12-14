import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const AdminCronButton = () => {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{ successful: number; failed: number; errors: string[] } | null>(null);

  const runCronDaily = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cron-daily', {
        body: { manual: true }
      });

      if (error) {
        console.error('Cron function error:', error);
        toast.error('Failed to run cron job: ' + error.message);
        return;
      }

      setLastResult(data);
      toast.success('Cron job completed successfully');
      console.warn('Cron job result:', data);
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