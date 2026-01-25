import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'cookie-consent-accepted';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAccepted = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!hasAccepted) {
      // Small delay to avoid flash on page load
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    setShowBanner(false);
  };

  const handleDismiss = () => {
    // Dismiss without accepting - will show again on next visit
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t shadow-lg">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 text-sm text-muted-foreground">
          <p>
            We use essential cookies to keep you signed in and remember your preferences. 
            By continuing to use Preppit Pacing, you agree to our{' '}
            <Link to="/privacy" className="text-primary underline hover:no-underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAccept} size="sm">
            Accept
          </Button>
          <Button 
            onClick={handleDismiss} 
            variant="ghost" 
            size="sm"
            className="p-2"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
