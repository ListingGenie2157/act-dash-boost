import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from '../_shared/cors.ts';

// Stripe price IDs for each plan
const PRICE_IDS = {
  monthly: "price_1SpNOrHa0TfiT4jGfXpytR29",      // $29.99/month recurring
  "90_day": "price_1SpNPAHa0TfiT4jGAQvwWd2W",    // $119 one-time
  "12_month": "price_1SpNPOHa0TfiT4jGIC35qxLq",  // $249 one-time
};

const logStep = (step: string, details?: Record<string, string | number | boolean | null>) => {
  // Sanitize: only log specific safe fields, not arbitrary objects
  const safeDetails = details ? Object.entries(details)
    .filter(([k]) => ['userId', 'planType', 'sessionId', 'customerId'].includes(k))
    .map(([k, v]) => `${k}=${v}`)
    .join(', ') : '';
  console.log(`[CREATE-CHECKOUT] ${step}${safeDetails ? ` - ${safeDetails}` : ''}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { planType } = await req.json();
    if (!planType || !PRICE_IDS[planType as keyof typeof PRICE_IDS]) {
      throw new Error(`Invalid plan type: ${planType}`);
    }
    logStep("Plan type received", { planType });

    const priceId = PRICE_IDS[planType as keyof typeof PRICE_IDS];
    const isSubscription = planType === "monthly";
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    const origin = req.headers.get("origin") || "https://act-dash-boost.lovable.app";
    
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: isSubscription ? "subscription" : "payment",
      success_url: `${origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      metadata: {
        user_id: user.id,
        plan_type: planType,
      },
      // For one-time payments, store metadata on payment intent
      ...(isSubscription ? {} : {
        payment_intent_data: {
          metadata: {
            user_id: user.id,
            plan_type: planType,
          },
        },
      }),
      // For subscriptions, add 7-day trial with payment method required
      ...(isSubscription ? {
        subscription_data: {
          trial_period_days: 7,
          metadata: {
            user_id: user.id,
            plan_type: planType,
          },
        },
        payment_method_collection: 'always',
      } : {}),
    };

    const session = await stripe.checkout.sessions.create(sessionParams);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
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
