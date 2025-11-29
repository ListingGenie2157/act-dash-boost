import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/env';

type HealthStatus = 'checking' | 'healthy' | 'unhealthy';

export function HealthCheck() {
  const [status, setStatus] = useState<HealthStatus>('checking');
  const [details, setDetails] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const checkHealth = async () => {
      const healthDetails: Record<string, unknown> = {};
      
      try {
        // Check Supabase connection
        const { error: dbError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
        
        const dbStatus = dbError ? { status: 'error' as const, message: dbError.message } : { status: 'ok' as const };
        healthDetails.database = dbStatus;
        
        // Check environment variables
        try {
          const url = getSupabaseUrl();
          const key = getSupabaseAnonKey();
          healthDetails.environment = {
            status: 'ok' as const,
            url_configured: !!url,
            key_configured: !!key,
          };
        } catch (envError) {
          healthDetails.environment = {
            status: 'error' as const,
            message: envError instanceof Error ? envError.message : String(envError),
          };
        }
        
        // Determine overall health
        const isHealthy = 
          (healthDetails.database as { status: string }).status === 'ok' &&
          (healthDetails.environment as { status: string }).status === 'ok';
        
        setStatus(isHealthy ? 'healthy' : 'unhealthy');
        setDetails(healthDetails);
      } catch (error) {
        setStatus('unhealthy');
        setDetails({
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    void checkHealth();
  }, []);

  if (status === 'checking') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Checking...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
        {status === 'healthy' ? 'OK' : 'UNHEALTHY'}
      </div>
      {import.meta.env.DEV && (
        <pre style={{ textAlign: 'left', fontSize: '12px', marginTop: '20px' }}>
          {JSON.stringify(details, null, 2)}
        </pre>
      )}
    </div>
  );
}
