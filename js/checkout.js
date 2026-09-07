import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  onAuthChange,
  getCurrentUser,
} from "./auth.js";
import { processRazorpayPayment, getDirectUpiDetails } from "./payment.js";

const CART_KEY = "scentifymeeCart";
const COUPON_KEY = "scentifymeeCoupon";
const ORDERS_KEY = "scentifymeeOrders";

const state = {
  appliedCoupon: localStorage.getItem(COUPON_KEY) || "",
};

let currentCustomer = getCurrentUser();
let pendingOrderAfterAuth = false;
let currentModalTab = "login";

let pendingUpiOrder = null;
let upiResolve = null;

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function getCart() {
  const cart = parseJson(localStorage.getItem(CART_KEY), []);
  if (!Array.isArray(cart)) return [];

  return cart.filter(Boolean).map((item) => ({
    productId: item.productId || item.slug || item.name || "unknown",
    name: item.name || "Product",
    brand: item.brand || "Scentifymee",
    image: item.image || "images/best-01.jpg",
    size: item.size || "3ml",
    price: Number(item.price) || 0,
    quantity: Math.max(1, Number(item.quantity) || 1),
  }));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function setCouponMessage(message, isError = false) {
  const node = document.getElementById("couponMessage");
  if (!node) return;

  node.textContent = message;
  node.classList.toggle("error", isError);
}

function calculateSubtotal(cart) {
  return cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
}

function calculateShipping(subtotal) {
  return subtotal >= 999 ? 0 : 100;
}

function calculateDiscount(subtotal) {
  const code = (state.appliedCoupon || "").trim().toUpperCase();
  if (code === "POKEMON") return subtotal * 0.2;
  return 0;
}

function calculateTotal(subtotal, shipping, discount) {
  return Math.max(0, subtotal - discount + shipping);
}

function renderSummary() {
  const cart = getCart();
  const summaryList = document.getElementById("summaryList");
  const subtotalLabel = document.getElementById("subtotalLabel");
  const subtotalValue = document.getElementById("subtotalValue");
  const shippingValue = document.getElementById("shippingValue");
  const totalValue = document.getElementById("totalValue");
  const discountRow = document.getElementById("discountRow");
  const discountValue = document.getElementById("discountValue");
  const couponInput = document.getElementById("couponInput");

  if (!summaryList || !subtotalLabel || !subtotalValue || !shippingValue || !totalValue) return;

  if (!cart.length) {
    summaryList.innerHTML = `
      <div class="empty-state">
        <h3>Your cart is empty</h3>
        <p>Please add a product before proceeding to checkout.</p>
        <a class="shop-all-btn" href="all_products.html">Shop All</a>
      </div>
    `;

    subtotalLabel.textContent = "Subtotal (0 items)";
    subtotalValue.textContent = "₹0";
    shippingValue.textContent = "₹0";
    totalValue.textContent = "₹0";
    discountRow.classList.add("hidden");
    if (couponInput) couponInput.value = "";
    document.querySelector(".place-order-btn")?.setAttribute("disabled", "disabled");
    const form = document.getElementById("checkoutForm");
    if (form)
      form.querySelectorAll("input, select").forEach((element) => {
        element.disabled = true;
      });
    return;
  }

  const subtotal = calculateSubtotal(cart);
  const shipping = calculateShipping(subtotal);
  const discount = calculateDiscount(subtotal);
  const total = calculateTotal(subtotal, shipping, discount);
  const units = cart.reduce((sum, item) => sum + Number(item.quantity) || 0, 0);

  summaryList.innerHTML = cart
    .map((item) => {
      const lineTotal = Number(item.price) * Number(item.quantity);
      return `
      <div class="summary-item">
        <img src="${item.image}" alt="${item.name}" />
        <div class="summary-item-info">
          <span class="summary-item-name">${item.name}</span>
          <span class="summary-item-size">${item.size} × ${item.quantity}</span>
        </div>
        <div class="summary-item-price">${formatCurrency(lineTotal)}</div>
      </div>
    `;
    })
    .join("");

  subtotalLabel.textContent = `Subtotal (${units} items)`;
  subtotalValue.textContent = formatCurrency(subtotal);
  shippingValue.textContent = shipping === 0 ? "Free" : formatCurrency(shipping);
  shippingValue.classList.toggle("free", shipping === 0);

  if (discount > 0 && state.appliedCoupon) {
    discountRow.classList.remove("hidden");
    discountValue.textContent = `- ${formatCurrency(discount)}`;
  } else {
    discountRow.classList.add("hidden");
  }

  totalValue.textContent = formatCurrency(total);

  if (couponInput && !couponInput.value) {
    couponInput.value = state.appliedCoupon || "";
  }

  const form = document.getElementById("checkoutForm");
  if (form)
    form.querySelectorAll("input, select").forEach((element) => {
      element.disabled = false;
    });
  document.querySelector(".place-order-btn")?.removeAttribute("disabled");
}

function validateField(name, value) {
  const trimmed = String(value || "").trim();

  switch (name) {
    case "fullName":
      if (!trimmed) return "Please enter your full name.";
      if (trimmed.length < 2) return "Please enter your full name.";
      return "";

    case "email": {
      if (!trimmed) return "Please enter your email address.";
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(trimmed)) return "Please enter a valid email address.";
      return "";
    }

    case "phone": {
      if (!trimmed) return "Please enter your phone number.";
      const phonePattern = /^[6-9]\d{9}$/;
      if (!phonePattern.test(trimmed)) return "Please enter a valid 10-digit mobile number.";
      return "";
    }

    case "address1":
      if (!trimmed) return "Please enter your delivery address.";
      return "";

    case "city":
      if (!trimmed) return "Please enter your city.";
      return "";

    case "state":
      if (!trimmed) return "Please select your state.";
      return "";

    case "pincode": {
      if (!trimmed) return "Please enter your pincode.";
      if (!/^\d{6}$/.test(trimmed)) return "Please enter a valid 6-digit pincode.";
      return "";
    }

    default:
      return "";
  }
}

function setFieldError(name, message) {
  const input = document.querySelector(`[name="${name}"]`);
  const fieldGroup = input?.closest(".field-group");
  const errorNode = document.querySelector(`[data-error-for="${name}"]`);

  if (fieldGroup) fieldGroup.classList.toggle("has-error", Boolean(message));
  if (errorNode) errorNode.textContent = message || "";
}

function validateForm() {
  const fields = ["fullName", "email", "phone", "address1", "city", "state", "pincode"];
  let valid = true;

  fields.forEach((name) => {
    const input = document.querySelector(`[name="${name}"]`);
    const value = input ? input.value : "";
    const message = validateField(name, value);
    setFieldError(name, message);
    if (message) valid = false;
  });

  return valid;
}

function getCustomerData() {
  return {
    fullName: document.getElementById("fullName").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    address1: document.getElementById("address1").value.trim(),
    address2: document.getElementById("address2").value.trim(),
    city: document.getElementById("city").value.trim(),
    state: document.getElementById("state").value,
    pincode: document.getElementById("pincode").value.trim(),
  };
}

function applyCoupon() {
  const input = document.getElementById("couponInput");
  const code = (input?.value || "").trim().toUpperCase();

  if (!code) {
    state.appliedCoupon = "";
    localStorage.removeItem(COUPON_KEY);
    setCouponMessage("Only valid codes work.", true);
    renderSummary();
    return;
  }

  if (code === "POKEMON") {
    state.appliedCoupon = code;
    localStorage.setItem(COUPON_KEY, code);
    setCouponMessage("Coupon applied successfully");
    renderSummary();
    return;
  }

  state.appliedCoupon = "";
  localStorage.removeItem(COUPON_KEY);
  setCouponMessage("Not a valid coupon", true);
  renderSummary();
}

function saveOrderToHistory(orderData) {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    const orders = raw ? JSON.parse(raw) : [];
    orders.unshift(orderData);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders.slice(0, 30)));
  } catch (e) {
    console.warn("Could not save order history:", e);
  }
}

function createOrder(authUser) {
  const cart = getCart();
  const subtotal = calculateSubtotal(cart);
  const shipping = calculateShipping(subtotal);
  const discount = calculateDiscount(subtotal);
  const total = calculateTotal(subtotal, shipping, discount);
  const paymentMethod =
    document.querySelector('input[name="paymentMethod"]:checked')?.value || "online";

  const orderId = `SCM-${Math.floor(Date.now() / 1000)}`;

  return {
    orderId,
    userId: authUser?.uid || null,
    userEmail: authUser?.email || getCustomerData().email,
    authProvider: authUser?.providerId || "unknown",
    customer: getCustomerData(),
    items: cart.map((item) => ({
      productId: item.productId,
      name: item.name,
      brand: item.brand,
      image: item.image,
      size: item.size,
      quantity: Number(item.quantity),
      price: Number(item.price),
    })),
    subtotal,
    discount,
    shipping,
    total,
    paymentMethod,
    createdAt: new Date().toISOString(),
  };
}

// ============================================
// DIRECT UPI MODAL HANDLING
// ============================================
function openUpiModal(orderData) {
  pendingUpiOrder = orderData;
  const upiDetails = getDirectUpiDetails(orderData);
  const modal = document.getElementById("upiModal");
  const qrImg = document.getElementById("upiQrImage");
  const amountText = document.getElementById("upiAmountText");
  const idText = document.getElementById("upiIdText");
  const directBtn = document.getElementById("upiPayDirectBtn");
  const utrInput = document.getElementById("upiUtrInput");

  if (qrImg) qrImg.src = upiDetails.qrUrl;
  if (amountText) amountText.textContent = formatCurrency(orderData.total);
  if (idText) idText.textContent = upiDetails.vpa;
  if (directBtn) directBtn.href = upiDetails.upiUri;
  if (utrInput) utrInput.value = "";
  if (modal) modal.classList.add("open");

  return new Promise((resolve) => {
    upiResolve = resolve;
  });
}

function closeUpiModal(cancelled = true) {
  const modal = document.getElementById("upiModal");
  if (modal) modal.classList.remove("open");
  if (cancelled && upiResolve) {
    upiResolve({ success: false, cancelled: true, error: "UPI payment window was closed." });
    upiResolve = null;
  }
}

async function initiatePayment(orderData) {
  const method = orderData.paymentMethod || "online";

  if (method === "upi") {
    return await openUpiModal(orderData);
  }

  // Default: Razorpay Standard Checkout (Cards, UPI, Netbanking, Wallets)
  return await processRazorpayPayment(orderData);
}

async function placeOrder() {
  const cart = getCart();
  if (!cart.length) {
    setCouponMessage("Your cart is empty", true);
    return;
  }

  const authUser = currentCustomer || getCurrentUser();
  if (!authUser) {
    pendingOrderAfterAuth = true;
    openAuthModal("Please sign in or create an account to complete and place your order.");
    return;
  }

  if (!validateForm()) {
    return;
  }

  const orderData = createOrder(authUser);
  const placeBtn = document.getElementById("placeOrderBtn");
  if (placeBtn) {
    placeBtn.disabled = true;
    placeBtn.textContent = "LAUNCHING PAYMENT...";
  }

  const paymentResult = await initiatePayment(orderData);

  if (placeBtn) {
    placeBtn.disabled = false;
    placeBtn.textContent = "PLACE ORDER";
  }

  if (!paymentResult.success) {
    if (paymentResult.cancelled) {
      setCouponMessage("Payment window was closed. Your cart & details are saved.", false);
    } else {
      setCouponMessage(paymentResult.error || "Payment could not be completed. Please try again.", true);
    }
    return;
  }

  // Attach verified payment metadata
  orderData.paymentId = paymentResult.paymentId || `PAY-${Date.now()}`;
  orderData.paymentSignature = paymentResult.signature || null;
  orderData.paymentMethod = paymentResult.paymentMethod || orderData.paymentMethod;
  orderData.paymentStatus = "paid";

  saveOrderToHistory(orderData);

  localStorage.removeItem(CART_KEY);
  localStorage.removeItem(COUPON_KEY);
  state.appliedCoupon = "";

  window.location.href = `order-success.html?order=${encodeURIComponent(orderData.orderId)}&payment=${encodeURIComponent(orderData.paymentId)}&method=${encodeURIComponent(orderData.paymentMethod)}`;
}

// ============================================
// AUTHENTICATION UI & MODAL MANAGEMENT
// ============================================
function updateAuthUI(user) {
  currentCustomer = user;
  const banner = document.getElementById("checkoutAuthBanner");
  const userCard = document.getElementById("checkoutAuthUserCard");
  const authAvatar = document.getElementById("authAvatar");
  const authUserName = document.getElementById("authUserName");
  const authUserEmail = document.getElementById("authUserEmail");

  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");

  if (user) {
    if (banner) banner.classList.add("hidden");
    if (userCard) userCard.classList.remove("hidden");

    if (authAvatar) {
      if (user.photoURL) {
        authAvatar.innerHTML = `<img src="${user.photoURL}" alt="${user.displayName || "User"}" />`;
      } else {
        const initial = (user.displayName || user.email || "U")[0].toUpperCase();
        authAvatar.textContent = initial;
      }
    }

    if (authUserName) authUserName.textContent = user.displayName || "Fragrance Lover";
    if (authUserEmail) authUserEmail.textContent = user.email || "";

    if (fullNameInput && (!fullNameInput.value.trim() || fullNameInput.dataset.autofilled === "true")) {
      fullNameInput.value = user.displayName || "";
      fullNameInput.dataset.autofilled = "true";
    }
    if (emailInput && (!emailInput.value.trim() || emailInput.dataset.autofilled === "true")) {
      emailInput.value = user.email || "";
      emailInput.dataset.autofilled = "true";
    }

    closeAuthModal();

    if (pendingOrderAfterAuth) {
      pendingOrderAfterAuth = false;
      placeOrder();
    }
  } else {
    if (banner) banner.classList.remove("hidden");
    if (userCard) userCard.classList.add("hidden");

    if (fullNameInput && fullNameInput.dataset.autofilled === "true") {
      fullNameInput.value = "";
      delete fullNameInput.dataset.autofilled;
    }
    if (emailInput && emailInput.dataset.autofilled === "true") {
      emailInput.value = "";
      delete emailInput.dataset.autofilled;
    }
  }
}

function openAuthModal(reason = "") {
  const modal = document.getElementById("authModal");
  const sub = document.getElementById("authModalSub");
  const err = document.getElementById("modalAuthError");
  if (sub && reason) sub.textContent = reason;
  if (err) err.textContent = "";
  if (modal) modal.classList.add("open");
}

function closeAuthModal() {
  const modal = document.getElementById("authModal");
  if (modal) modal.classList.remove("open");
}

function setModalTab(tab) {
  currentModalTab = tab;
  document.querySelectorAll(".auth-tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  const nameField = document.getElementById("modalNameField");
  const submitBtn = document.getElementById("modalSubmitBtn");
  const err = document.getElementById("modalAuthError");
  if (err) err.textContent = "";

  if (tab === "register") {
    if (nameField) nameField.style.display = "flex";
    if (submitBtn) submitBtn.textContent = "Create Account & Continue";
  } else {
    if (nameField) nameField.style.display = "none";
    if (submitBtn) submitBtn.textContent = "Sign In & Continue";
  }
}

function setModalError(msg) {
  const err = document.getElementById("modalAuthError");
  if (err) err.textContent = msg || "";
}

async function handleGoogleLogin() {
  setModalError("");
  const res = await loginWithGoogle();
  if (res.success) {
    updateAuthUI(res.user);
  } else {
    setModalError(res.error || "Google Sign-In failed.");
  }
}

async function handleModalFormSubmit(event) {
  event.preventDefault();
  setModalError("");

  const email = document.getElementById("modalEmail")?.value.trim() || "";
  const password = document.getElementById("modalPassword")?.value.trim() || "";
  const name = document.getElementById("modalName")?.value.trim() || "";

  if (!email || !password) {
    setModalError("Please provide both email and password.");
    return;
  }

  const submitBtn = document.getElementById("modalSubmitBtn");
  const originalText = submitBtn ? submitBtn.textContent : "";
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "AUTHENTICATING...";
  }

  let result;
  if (currentModalTab === "register") {
    result = await registerWithEmail(email, password, name);
  } else {
    result = await loginWithEmail(email, password);
  }

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }

  if (result.success) {
    updateAuthUI(result.user);
  } else {
    setModalError(result.error || "Authentication failed. Please try again.");
  }
}

function attachEvents() {
  document.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      document.querySelectorAll(".payment-option").forEach((label) => {
        label.classList.toggle("selected", label.querySelector("input").checked);
      });
    });
  });

  document.getElementById("couponApply")?.addEventListener("click", applyCoupon);
  document.getElementById("couponInput")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyCoupon();
    }
  });

  document.getElementById("checkoutForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    placeOrder();
  });

  document.getElementById("placeOrderBtn")?.addEventListener("click", () => {
    document.getElementById("checkoutForm")?.requestSubmit();
  });

  // Auth UI triggers
  document.getElementById("bannerGoogleBtn")?.addEventListener("click", handleGoogleLogin);
  document.getElementById("modalGoogleBtn")?.addEventListener("click", handleGoogleLogin);

  document.getElementById("bannerEmailBtn")?.addEventListener("click", () => {
    setModalTab("login");
    openAuthModal();
  });

  document.getElementById("authSignOutBtn")?.addEventListener("click", async () => {
    await logoutUser();
    updateAuthUI(null);
  });

  document.getElementById("authModalClose")?.addEventListener("click", closeAuthModal);
  document.getElementById("authModal")?.addEventListener("click", (event) => {
    if (event.target === document.getElementById("authModal")) {
      closeAuthModal();
    }
  });

  document.querySelectorAll(".auth-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      setModalTab(btn.dataset.tab);
    });
  });

  document.getElementById("modalAuthForm")?.addEventListener("submit", handleModalFormSubmit);

  // Direct UPI modal triggers
  document.getElementById("upiModalClose")?.addEventListener("click", () => closeUpiModal(true));
  document.getElementById("upiModal")?.addEventListener("click", (event) => {
    if (event.target === document.getElementById("upiModal")) {
      closeUpiModal(true);
    }
  });

  document.getElementById("upiCopyBtn")?.addEventListener("click", () => {
    const idText = document.getElementById("upiIdText")?.textContent || "souravdhara087-2@okicici";
    navigator.clipboard.writeText(idText).then(() => {
      const btn = document.getElementById("upiCopyBtn");
      if (btn) {
        btn.textContent = "COPIED!";
        setTimeout(() => {
          btn.textContent = "COPY";
        }, 2000);
      }
    });
  });

  document.getElementById("upiConfirmBtn")?.addEventListener("click", () => {
    const utr = document.getElementById("upiUtrInput")?.value.trim();
    const paymentId = utr ? `UTR-${utr}` : `UPI-${Date.now().toString(36).toUpperCase()}`;
    if (upiResolve) {
      upiResolve({
        success: true,
        paymentId,
        orderId: pendingUpiOrder?.orderId,
        paymentMethod: "upi",
      });
      upiResolve = null;
    }
    closeUpiModal(false);
  });

  ["fullName", "email", "phone", "address1", "city", "state", "pincode"].forEach((name) => {
    const input = document.querySelector(`[name="${name}"]`);
    if (!input) return;

    input.addEventListener("input", () => {
      if (input.dataset.autofilled === "true") {
        delete input.dataset.autofilled;
      }
      const message = validateField(name, input.value);
      setFieldError(name, message);
    });

    input.addEventListener("blur", () => {
      const message = validateField(name, input.value);
      setFieldError(name, message);
    });
  });
}

function initCheckoutPage() {
  renderSummary();
  attachEvents();

  const couponInput = document.getElementById("couponInput");
  if (couponInput && state.appliedCoupon) {
    couponInput.value = state.appliedCoupon;
  }

  // Subscribe to auth state
  onAuthChange(updateAuthUI);
}

document.addEventListener("DOMContentLoaded", initCheckoutPage);
