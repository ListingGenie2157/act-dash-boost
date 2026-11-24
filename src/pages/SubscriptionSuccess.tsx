import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';
import confetti from 'canvas-confetti';

const MAX_POLL_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 3000;

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const { refetch, isSubscribed } = useSubscription();
  const [pollAttempts, setPollAttempts] = useState(0);
  const [hasConfettiFired, setHasConfettiFired] = useState(false);
  const [showManualRetry, setShowManualRetry] = useState(false);

  // Fire confetti when subscription is confirmed
  useEffect(() => {
    if (isSubscribed && !hasConfettiFired) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setHasConfettiFired(true);
    }
  }, [isSubscribed, hasConfettiFired]);

  // Poll for subscription status if webhook is delayed
  useEffect(() => {
    // Initial fetch
    refetch();
  }, [refetch]);

  useEffect(() => {
    // If already subscribed, no need to poll
    if (isSubscribed) {
      setShowManualRetry(false);
      return;
    }

    // If we've exhausted attempts, show manual retry
    if (pollAttempts >= MAX_POLL_ATTEMPTS) {
      setShowManualRetry(true);
      return;
    }

    // Poll every 3 seconds
    const timer = setTimeout(() => {
      refetch();
      setPollAttempts(prev => prev + 1);
    }, POLL_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [isSubscribed, pollAttempts, refetch]);

  // Once the trial is active, /start sends new families to onboarding
  // (returning subscribers to the dashboard).
  useEffect(() => {
    if (!isSubscribed) return;
    const timer = setTimeout(() => navigate('/start', { replace: true }), 1500);
    return () => clearTimeout(timer);
  }, [isSubscribed, navigate]);

  const handleManualRetry = useCallback(() => {
    setPollAttempts(0);
    setShowManualRetry(false);
    refetch();
  }, [refetch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-accent" />
          </div>
          <CardTitle className="text-2xl">Welcome to Preppit!</CardTitle>
          <CardDescription>
            Your 7-day free trial has started. You won't be charged until it ends.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Next, a few quick questions to set up your study plan.
          </p>
          
          {/* Polling/Loading State */}
          {!isSubscribed && !showManualRetry && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Starting your trial...
              {pollAttempts > 0 && (
                <span className="text-xs">({pollAttempts}/{MAX_POLL_ATTEMPTS})</span>
              )}
            </div>
          )}
          
          {/* Manual Retry State */}
          {showManualRetry && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                Taking longer than expected...
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Your payment was successful. If your subscription isn't showing yet, 
                please wait a moment and try again.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleManualRetry}
                className="w-full gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Check Again
              </Button>
            </div>
          )}
          
          {/* Success State */}
          {isSubscribed && (
            <div className="flex items-center justify-center gap-2 text-sm text-accent">
              <CheckCircle className="w-4 h-4" />
              Trial active. Taking you to setup…
            </div>
          )}
        </CardContent>
        {isSubscribed && (
          <CardFooter>
            <Button className="w-full" size="lg" onClick={() => navigate('/start', { replace: true })}>
              Continue
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
