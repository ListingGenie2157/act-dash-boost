import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function RunMigration() {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const runMigration = async () => {
    setStatus('running');
    setMessage('Running migration...');

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to run the migration');
      }

      // Step 1: Try to update the current user's profile with new columns
      // This will work if columns exist, or create them if using upsert
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          onboarding_complete: false,
          onboarding_step: null 
        })
        .eq('id', user.id);

      if (updateError) {
        // Columns might not exist yet
        setMessage(`Please run this SQL in Supabase Dashboard → SQL Editor:\n\n${getMigrationSQL()}`);
        setStatus('error');
        return;
      }

      // Success!
      setStatus('success');
      setMessage('Migration complete! Refresh your browser to see the onboarding wizard.');
      
      // Auto-refresh after 2 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Migration failed. Please run the SQL manually.');
    }
  };

  const getMigrationSQL = () => {
    return `-- Run this in Supabase Dashboard → SQL Editor
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_step TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding 
ON public.profiles(onboarding_complete) 
WHERE onboarding_complete = false;

UPDATE public.profiles 
SET onboarding_complete = false, 
    onboarding_step = NULL
WHERE onboarding_complete IS NULL;`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Run Onboarding Migration</CardTitle>
          <CardDescription>
            This will set up the database columns needed for the onboarding wizard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'idle' && (
            <>
              <p className="text-sm text-muted-foreground">
                Click the button below to run the migration. This will:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Add onboarding tracking columns to your profile</li>
                <li>Set you up to complete the 7-step onboarding wizard</li>
                <li>Only takes a second!</li>
              </ul>
              <Button onClick={runMigration} size="lg" className="w-full">
                Run Migration Now
              </Button>
            </>
          )}

          {status === 'running' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <p className="mt-4 text-lg font-semibold">Migration Complete!</p>
              <p className="text-sm text-muted-foreground mt-2">{message}</p>
              <p className="text-sm text-muted-foreground mt-4">Redirecting to onboarding wizard...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Migration Not Available</p>
                  <p className="text-sm text-muted-foreground">
                    Please run this SQL in your Supabase Dashboard:
                  </p>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {getMigrationSQL()}
                </pre>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-semibold">Steps:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to supabase.com/dashboard</li>
                  <li>Select your project</li>
                  <li>Click SQL Editor</li>
                  <li>Copy and paste the SQL above</li>
                  <li>Click Run</li>
                  <li>Come back here and refresh</li>
                </ol>
              </div>

              <Button onClick={runMigration} variant="outline" className="w-full">
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
