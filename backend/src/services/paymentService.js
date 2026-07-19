// A tiny, provider-agnostic payment interface so orderController never has
// to know which payment gateway is in use.
//
// Defaults to mock mode: charge() "succeeds" instantly, so the full
// checkout flow (stock, order creation, cart clearing) can be built and
// tested without a real payment account.
//
// To go live, implement charge() against a real provider's SDK (Stripe,
// iyzico, ...) and set PAYMENT_MOCK_MODE=false. Example with Stripe:
//
//   const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
//   const intent = await stripe.paymentIntents.create({
//     amount: Math.round(amount * 100), currency, metadata: { orderId },
//     confirm: true, payment_method: "pm_card_visa",
//   });
//   return { success: intent.status === "succeeded", reference: intent.id };

const MOCK_MODE = process.env.PAYMENT_MOCK_MODE !== "false";

const charge = async ({ amount, orderId }) => {
  if (MOCK_MODE) {
    return { success: true, reference: `MOCK-${orderId}-${Date.now()}` };
  }
  throw new Error("No live payment provider configured. Implement charge() above, or set PAYMENT_MOCK_MODE=true.");
};

module.exports = { charge };
