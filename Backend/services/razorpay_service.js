// Server/services/razorpay_service.js
// Shared Razorpay Client, Order Builder, and Constant-Time HMAC Signature Verification
const Razorpay = require("razorpay");
const crypto = require("crypto");
const config = require("../config");

function isConfigured() {
  const keyId = config.RAZORPAY_KEY_ID || "";
  const keySecret = config.RAZORPAY_KEY_SECRET || "";
  return (
    Boolean(keyId && keySecret) &&
    !keyId.includes("your_key_id") &&
    !keySecret.includes("your_razorpay")
  );
}

function getRazorpayClient() {
  if (!isConfigured()) {
    const err = new Error("Razorpay API keys are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Server/.env");
    err.statusCode = 503;
    throw err;
  }
  return new Razorpay({
    key_id: config.RAZORPAY_KEY_ID,
    key_secret: config.RAZORPAY_KEY_SECRET,
  });
}

async function createRazorpayOrder({ amountInINR, currency = "INR", receiptPrefix = "rcpt", notes = {} }) {
  const numericAmount = Math.max(0, Number(amountInINR) || 0);
  if (numericAmount <= 0) {
    const err = new Error("Order amount must be greater than zero");
    err.statusCode = 400;
    throw err;
  }

  const razorpay = getRazorpayClient();
  // Razorpay enforces receipt length <= 40 characters
  const receipt = `${receiptPrefix}_${Date.now().toString(36)}`.slice(0, 40);

  const order = await razorpay.orders.create({
    amount: Math.round(numericAmount * 100), // convert INR to paise
    currency,
    receipt,
    notes,
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: config.RAZORPAY_KEY_ID,
  };
}

function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  if (
    typeof orderId !== "string" || !orderId.trim() ||
    typeof paymentId !== "string" || !paymentId.trim() ||
    typeof signature !== "string" || !signature.trim()
  ) {
    return false;
  }

  if (!isConfigured()) {
    return false;
  }

  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", config.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const signatureBuf = Buffer.from(signature.trim(), "utf8");
  if (expectedBuf.length !== signatureBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

module.exports = {
  isConfigured,
  getRazorpayClient,
  createRazorpayOrder,
  verifyRazorpaySignature,
};
