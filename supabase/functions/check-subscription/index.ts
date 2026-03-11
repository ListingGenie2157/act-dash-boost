import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { getPriceToPlan } from '../_shared/stripeConfig.ts';
import { requireEnv } from '../_shared/env.ts';
import { checkRateLimit, getClientIp, createRateLimitResponse } from '../_shared/rateLimit.ts';

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = requireEnv("STRIPE_SECRET_KEY");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      requireEnv("SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id });

    // Rate limit: 30 checks per minute per user
    const clientIp = getClientIp(req);
    const allowed = await checkRateLimit(user.id, clientIp, 'check-subscription', 30, 60000);
    if (!allowed) {
      return createRateLimitResponse(corsHeaders);
    }

    // First check our local subscription table
    const { data: localSub } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (localSub && (localSub.status === "active" || localSub.status === "trialing")) {
      const now = new Date();
      const periodEnd = new Date(localSub.current_period_end);
      
      if (periodEnd > now) {
        logStep("Found active/trialing local subscription", { planType: localSub.plan_type, status: localSub.status });
        return new Response(JSON.stringify({
          subscribed: true,
          plan_type: localSub.plan_type,
          subscription_end: localSub.current_period_end,
          cancel_at_period_end: localSub.cancel_at_period_end,
          is_trialing: localSub.status === "trialing",
          trial_end: localSub.status === "trialing" ? localSub.current_period_end : null,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        await supabaseClient
          .from("subscriptions")
          .update({ status: "expired" })
          .eq("user_id", user.id);
        logStep("Local subscription expired, marked as expired");
      }
    }

    // Check Stripe for active subscriptions
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
    });

    const activeSub = subscriptions.data.find(
      (sub: { status: string }) => sub.status === 'active' || sub.status === 'trialing'
    );

    if (activeSub) {
      const subscription = activeSub;
      const PRICE_TO_PLAN = getPriceToPlan();
      const priceId = subscription.items.data[0].price.id;
      const planType = PRICE_TO_PLAN[priceId] || "monthly";
      const isTrialing = subscription.status === 'trialing';
      
      // Safely convert timestamps – guard against null/undefined
      const periodEndTs = subscription.current_period_end;
      const trialEndTs = subscription.trial_end;
      
      const safeDate = (ts: number | null | undefined): string | null => {
        if (ts == null) return null;
        try { return new Date(ts * 1000).toISOString(); } catch { return null; }
      };
      
      const subscriptionEnd = (isTrialing ? safeDate(trialEndTs) : null) ?? safeDate(periodEndTs) ?? new Date().toISOString();
      const trialEndIso = isTrialing ? safeDate(trialEndTs) : null;
      
      logStep("Subscription dates", { periodEndTs, trialEndTs, subscriptionEnd });
      
      await supabaseClient
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          plan_type: planType,
          status: isTrialing ? "trialing" : "active",
          current_period_start: safeDate(subscription.current_period_start) ?? new Date().toISOString(),
          current_period_end: subscriptionEnd,
          cancel_at_period_end: subscription.cancel_at_period_end,
        }, { onConflict: "user_id" });

      logStep("Subscription found", { subscriptionId: subscription.id, planType, status: subscription.status });
      
      return new Response(JSON.stringify({
        subscribed: true,
        plan_type: planType,
        subscription_end: subscriptionEnd,
        cancel_at_period_end: subscription.cancel_at_period_end,
        is_trialing: isTrialing,
        trial_end: trialEndIso,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("No active or trialing subscription found");
    return new Response(JSON.stringify({ subscribed: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
