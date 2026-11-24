import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Shield, Clock, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription, PLAN_NAMES, PLAN_PRICES } from '@/hooks/useSubscription';
import { Settings } from 'lucide-react';
import { useAuthUser } from '@/hooks/queries/useAuth';
import { toast } from 'sonner';
import { PLAN_STORAGE_KEY } from '@/lib/postAuthRoute';

const FEATURES = [
  'Full access to all 4 ACT subjects',
  'Personalized study plans',
  'AI-powered tutor',
  'Full practice tests & simulations',
  'Skill-based drills & lessons',
  'Progress analytics & mastery tracking',
  'Spaced repetition review system',
  'Parent portal access',
];

interface PricingCardProps {
  planType: 'monthly' | '90_day' | '12_month';
  title: string;
  description: string;
  isPopular?: boolean;
  isCurrentPlan?: boolean;
  onSelect: (planType: 'monthly' | '90_day' | '12_month') => void;
  isLoading: boolean;
}

function PricingCard({ planType, title, description, isPopular, isCurrentPlan, onSelect, isLoading }: PricingCardProps) {
  const price = PLAN_PRICES[planType];
  const hasFreeTrial = planType === 'monthly';
  
  return (
    <Card className={`relative flex flex-col ${isPopular ? 'border-primary shadow-lg scale-105' : ''} ${isCurrentPlan ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' : ''}`}>
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
          Most Popular
        </Badge>
      )}
      {isCurrentPlan && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500">
          Your Plan
        </Badge>
      )}
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-center flex-1">
        <div className="mb-2">
          <span className="text-4xl font-bold">${price.amount}</span>
          {planType === 'monthly' && <span className="text-muted-foreground">/mo</span>}
        </div>
        {hasFreeTrial && (
          <Badge variant="secondary" className="mb-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Clock className="w-3 h-3 mr-1 inline" />
            7-day free trial
          </Badge>
        )}
        {price.savings && (
          <Badge variant="secondary" className="mb-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            {price.savings}
          </Badge>
        )}
        <Badge variant="outline" className="mb-6 block w-fit mx-auto">
          <Shield className="w-3 h-3 mr-1 inline" />
          Cancel anytime
        </Badge>
        <ul className="space-y-2 text-sm text-left">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          size="lg"
          variant={isPopular ? 'default' : 'outline'}
          onClick={() => onSelect(planType)}
          disabled={isLoading || isCurrentPlan}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : hasFreeTrial ? (
            'Start Free Trial'
          ) : (
            'Get Started'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Pricing() {
  const navigate = useNavigate();
  const { data: user } = useAuthUser();
  const { isSubscribed, planType: currentPlan, createCheckout, openCustomerPortal } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const handleSelectPlan = async (planType: 'monthly' | '90_day' | '12_month') => {
    if (!user) {
      // Sign up first; /start then opens checkout for this plan.
      try {
        sessionStorage.setItem(PLAN_STORAGE_KEY, planType);
      } catch {
        // storage unavailable: the plan still travels in the URL
      }
      navigate(`/login?mode=signup&plan=${planType}`);
      return;
    }

    setLoadingPlan(planType);
    try {
      await createCheckout(planType);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-6xl py-12 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Zap className="w-3 h-3 mr-1" />
            Unlock Your Potential
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Choose Your ACT Prep Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get full access to personalized study plans, AI tutoring, practice tests, and more.
            Cancel anytime with no hidden fees.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <PricingCard
            planType="monthly"
            title={PLAN_NAMES.monthly}
            description="Flexible month-to-month"
            onSelect={handleSelectPlan}
            isLoading={loadingPlan === 'monthly'}
            isCurrentPlan={isSubscribed && currentPlan === 'monthly'}
          />
          <PricingCard
            planType="90_day"
            title={PLAN_NAMES['90_day']}
            description="Perfect for focused prep"
            isPopular
            onSelect={handleSelectPlan}
            isLoading={loadingPlan === '90_day'}
            isCurrentPlan={isSubscribed && currentPlan === '90_day'}
          />
          <PricingCard
            planType="12_month"
            title={PLAN_NAMES['12_month']}
            description="Best value for long-term prep"
            onSelect={handleSelectPlan}
            isLoading={loadingPlan === '12_month'}
            isCurrentPlan={isSubscribed && currentPlan === '12_month'}
          />
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-8 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="text-sm">Secure checkout with Stripe</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm">Instant access</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            <span className="text-sm">100% satisfaction guarantee</span>
          </div>
        </div>

        {/* Manage Subscription + Back to dashboard for subscribers */}
        {isSubscribed && (
          <div className="text-center mt-8 space-y-3">
            <Button 
              variant="outline" 
              size="lg"
              className="gap-2"
              onClick={async () => {
                setLoadingPortal(true);
                try {
                  await openCustomerPortal();
                } catch (error) {
                  console.error('Portal error:', error);
                  toast.error('Failed to open subscription portal. Please try again.');
                } finally {
                  setLoadingPortal(false);
                }
              }}
              disabled={loadingPortal}
            >
              {loadingPortal ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4" />
                  Manage Subscription
                </>
              )}
            </Button>
            <div>
              <Button variant="link" onClick={() => navigate('/dashboard')}>
                ← Back to Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
