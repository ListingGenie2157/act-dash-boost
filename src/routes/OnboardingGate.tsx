import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import OnboardingWizard from '@/features/onboarding/OnboardingWizard';
import Index from '@/pages/Index';

export default function OnboardingGate() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    },
  });

  // Show loading state
  if (userLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in - Index will handle showing the landing page or redirecting to login
  if (!user) {
    return <Index />;
  }

  // User needs to complete onboarding
  if (!profile || profile.onboarding_complete === false) {
    return <OnboardingWizard initialStep={profile?.onboarding_step} />;
  }

  // User has completed onboarding - show the dashboard
  return <Index />;
}
