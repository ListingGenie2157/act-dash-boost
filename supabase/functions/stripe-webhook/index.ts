import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from '../_shared/cors.ts';

// Product IDs for plan identification
const PRODUCT_TO_PLAN: Record<string, string> = {
  "prod_TmxJE2ECwzSjMp": "monthly",
  "prod_TmxJKMqCjxglb6": "90_day",
  "prod_TmxKBXb9uac3oL": "12_month",
};

// Duration in days for one-time purchases
const PLAN_DURATIONS: Record<string, number> = {
  "90_day": 90,
  "12_month": 365,
};

// Safe fields that are allowed in logs (no PII)
const SAFE_LOG_FIELDS = ['userId', 'planType', 'customerId', 'subscriptionId', 'status', 'type', 'endDate', 'message'];

const logStep = (step: string, details?: Record<string, string | number | boolean | null>) => {
  const safeDetails = details ? Object.entries(details)
    .filter(([k]) => SAFE_LOG_FIELDS.includes(k))
    .map(([k, v]) => `${k}=${v}`)
    .join(', ') : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${safeDetails ? ` - ${safeDetails}` : ''}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    let event: Stripe.Event;
    
    if (!webhookSecret) {
      logStep("STRIPE_WEBHOOK_SECRET not configured - rejecting request");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (!signature) {
      logStep("Missing stripe-signature header");
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified");
    } catch (err) {
      logStep("Webhook signature verification failed");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    logStep("Processing event", { type: event.type as string });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const planType = session.metadata?.plan_type;
        const customerId = session.customer as string;
        
        if (!userId || !planType) {
          logStep("Missing metadata", { userId, planType });
          break;
        }

        logStep("Checkout completed", { userId, planType });

        if (session.mode === "subscription") {
          // Subscription will be handled by customer.subscription.created
          logStep("Subscription mode - waiting for subscription event");
        } else {
          // One-time payment - create access record
          const durationDays = PLAN_DURATIONS[planType] || 90;
          const now = new Date();
          const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

          await supabaseClient
            .from("subscriptions")
            .upsert({
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: session.payment_intent as string,
              plan_type: planType,
              status: "active",
              current_period_start: now.toISOString(),
              current_period_end: endDate.toISOString(),
              cancel_at_period_end: false,
            }, { onConflict: "user_id" });

          logStep("One-time payment recorded", { userId, planType, endDate: endDate.toISOString() });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        const customerId = subscription.customer as string;
        
        if (!userId) {
          logStep("No user_id in subscription metadata");
          break;
        }

        const productId = subscription.items.data[0].price.product as string;
        const planType = PRODUCT_TO_PLAN[productId] || "monthly";

        await supabaseClient
          .from("subscriptions")
          .upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            plan_type: planType,
            status: subscription.status === "active" ? "active" : subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          }, { onConflict: "user_id" });

        logStep("Subscription updated", { userId, planType, status: subscription.status });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        
        if (userId) {
          await supabaseClient
            .from("subscriptions")
            .update({ status: "canceled" })
            .eq("user_id", userId);
          
          logStep("Subscription canceled", { userId });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        if (subscriptionId) {
          await supabaseClient
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_subscription_id", subscriptionId);
          
          logStep("Payment failed, marked as past_due", { subscriptionId });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
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
