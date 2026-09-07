/**
 * ============================================================
 * SCENTIFYMEE — Payment Gateway Configuration
 * ============================================================
 * Centralized settings for Razorpay and UPI payments.
 */

export const paymentConfig = {
  // Razorpay Public Key ID (Safe for client-side use)
  razorpayKeyId: "rzp_test_TYtzBn0FbR7zOI",

  // Direct UPI VPA ID
  upiId: "souravdhara087-2@okicici",
  upiPayeeName: "Scentifymee",

  // Store & Theme metadata
  storeName: "Scentifymee",
  storeDescription: "Luxury Fragrance Decants",
  storeThemeColor: "#c9a45c",
  currency: "INR",
};

export function isRazorpayConfigured() {
  return (
    Boolean(paymentConfig.razorpayKeyId) &&
    !paymentConfig.razorpayKeyId.includes("YOUR_KEY")
  );
}
