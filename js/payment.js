/**
 * ============================================================
 * SCENTIFYMEE — Payment Gateway Service
 * ============================================================
 * Handles Razorpay Standard Checkout (UPI, Cards, Netbanking)
 * and Direct UPI QR Code payments.
 */

import { paymentConfig } from "./payment-config.js";

/**
 * Dynamically load Razorpay Checkout SDK if not already present
 */
function loadRazorpaySdk() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay Checkout SDK."));
    document.head.appendChild(script);
  });
}

/**
 * Open Razorpay Standard Checkout popup
 */
export async function processRazorpayPayment(orderData) {
  try {
    await loadRazorpaySdk();
  } catch (err) {
    return {
      success: false,
      error: "Unable to load Razorpay. Please check your internet connection.",
    };
  }

  return new Promise((resolve) => {
    const amountInPaise = Math.round(Number(orderData.total) * 100);

    const options = {
      key: paymentConfig.razorpayKeyId,
      amount: amountInPaise,
      currency: paymentConfig.currency || "INR",
      name: paymentConfig.storeName,
      description: `${paymentConfig.storeDescription} • Order ${orderData.orderId}`,
      image: "images/best-01.jpg",
      prefill: {
        name: orderData.customer?.fullName || "",
        email: orderData.customer?.email || "",
        contact: orderData.customer?.phone || "",
      },
      notes: {
        orderId: orderData.orderId,
        customerName: orderData.customer?.fullName || "",
      },
      theme: {
        color: paymentConfig.storeThemeColor,
      },
      modal: {
        backdropclose: false,
        escape: true,
        handleback: true,
        confirm_close: true,
        ondismiss: function () {
          resolve({
            success: false,
            cancelled: true,
            error: "Payment window was closed before completing.",
          });
        },
      },
      handler: function (response) {
        resolve({
          success: true,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature || null,
          razorpayOrderId: response.razorpay_order_id || null,
          orderId: orderData.orderId,
          paymentMethod: "razorpay",
        });
      },
    };

    try {
      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on("payment.failed", function (response) {
        resolve({
          success: false,
          error: response.error?.description || "Payment failed. Please try again or use another payment method.",
          code: response.error?.code,
        });
      });
      rzpInstance.open();
    } catch (e) {
      console.error("Razorpay initiation error:", e);
      resolve({
        success: false,
        error: e.message || "Failed to initialize payment gateway.",
      });
    }
  });
}

/**
 * Direct UPI Payment URL and QR parameters
 */
export function getDirectUpiDetails(orderData) {
  const vpa = paymentConfig.upiId;
  const name = paymentConfig.upiPayeeName;
  const amount = Number(orderData.total).toFixed(2);
  const note = `Order ${orderData.orderId} - Scentifymee`;

  // Standard UPI URI format
  const upiUri = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(name)}&am=${encodeURIComponent(amount)}&cu=INR&tn=${encodeURIComponent(note)}`;

  // High-contrast QR code URL
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(upiUri)}`;

  return {
    vpa,
    payeeName: name,
    amount: orderData.total,
    note,
    upiUri,
    qrUrl,
    orderId: orderData.orderId,
  };
}
