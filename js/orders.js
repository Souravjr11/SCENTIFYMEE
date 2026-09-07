import {
  onAuthChange,
  getCurrentUser,
  loginWithGoogle,
} from "./auth.js";
import {
  fetchUserOrdersFromCloud,
  syncLocalOrdersToCloud,
  subscribeToUserOrders,
} from "./firestore.js";

const ORDERS_KEY = "scentifymeeOrders";
const CART_KEY = "scentifymeeCart";

let currentCustomer = null;
let allSavedOrders = [];

// ============================================
// HELPERS
// ============================================
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function formatDate(isoString) {
  if (!isoString) return "Recent";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

function showToast(message) {
  const toast = document.getElementById("ordersToast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

function updateCartBadge() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const cart = raw ? JSON.parse(raw) : [];
    const count = Array.isArray(cart)
      ? cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
      : 0;

    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      el.textContent = String(count);
      el.hidden = count === 0;
    });
  } catch {}
}

// ============================================
// STORAGE HELPERS
// ============================================
function loadOrdersFromStorage() {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error reading orders:", err);
    return [];
  }
}

// ============================================
// RENDERING
// ============================================
function renderUserBar(user, orderCount) {
  const avatar = document.getElementById("userAvatar");
  const nameEl = document.getElementById("userName");
  const emailEl = document.getElementById("userEmail");
  const countBadge = document.getElementById("orderCountBadge");

  if (countBadge) {
    countBadge.textContent = `${orderCount} ${orderCount === 1 ? "Order" : "Orders"}`;
  }

  if (user) {
    if (avatar) {
      if (user.photoURL) {
        avatar.innerHTML = `<img src="${user.photoURL}" alt="${user.displayName || "User"}" />`;
      } else {
        const initial = (user.displayName || user.email || "U")[0].toUpperCase();
        avatar.textContent = initial;
      }
    }
    if (nameEl) nameEl.textContent = user.displayName || "Fragrance Enthusiast";
    if (emailEl) emailEl.textContent = user.email || "";
  } else {
    if (avatar) avatar.textContent = "G";
    if (nameEl) nameEl.textContent = "Guest Customer";
    if (emailEl) emailEl.textContent = "Device Orders";
  }
}

function renderAuthPrompt() {
  const container = document.getElementById("ordersContainer");
  if (!container) return;

  container.innerHTML = `
    <div class="auth-prompt-card">
      <h2>Sign In to View Orders</h2>
      <p>Log in with your Scentifymee account to track past purchases, inspect delivery statuses, and re-order signature fragrances.</p>
      
      <button type="button" class="google-auth-btn" id="promptGoogleBtn">
        <svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
        <span>Continue with Google</span>
      </button>

      <a href="account.html?redirect=orders.html" class="email-auth-link">Sign in with Email</a>
    </div>
  `;

  document.getElementById("promptGoogleBtn")?.addEventListener("click", async () => {
    const res = await loginWithGoogle();
    if (!res.success) {
      alert(res.error || "Google Sign-In failed.");
    }
  });
}

function renderEmptyState(isLoggedIn) {
  const container = document.getElementById("ordersContainer");
  if (!container) return;

  container.innerHTML = `
    <div class="empty-orders-card">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
      </div>
      <h2 class="empty-title">No Orders Found</h2>
      <p class="empty-desc">
        ${
          isLoggedIn
            ? "You haven't placed any fragrance orders under this account yet. Discover exceptional designer decants in our collection."
            : "No previous orders were found on this device. Sign in to load orders associated with your Scentifymee account."
        }
      </p>
      <a href="all_products.html" class="empty-cta-btn">Explore Fragrances</a>
    </div>
  `;
}

function renderOrderCard(order) {
  const orderDate = formatDate(order.createdAt);
  const paymentBadge =
    order.paymentMethod === "upi"
      ? `<span class="payment-ref-badge" title="Direct UPI Payment">📱 <strong>UPI:</strong> ${order.paymentId || "Verified"}</span>`
      : `<span class="payment-ref-badge" title="Razorpay Secure Payment">💳 <strong>Razorpay:</strong> ${order.paymentId || "Verified"}</span>`;

  const customer = order.customer || {};
  const shippingAddress = [
    customer.address1,
    customer.address2,
    customer.city,
    customer.state,
    customer.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  const itemsHtml = (order.items || [])
    .map((item) => {
      const itemSubtotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
      return `
        <div class="order-item-row">
          <div class="order-item-thumb">
            <img src="${item.image || "images/best-01.jpg"}" alt="${item.name || "Perfume"}" loading="lazy" onerror="this.src='images/best-01.jpg'" />
          </div>
          <div class="order-item-info">
            <span class="order-item-brand">${item.brand || "Scentifymee"}</span>
            <span class="order-item-name">${item.name || "Fragrance Decant"}</span>
            <div class="order-item-meta">
              <span class="size-pill">${item.size || "3ml"} decant</span>
              <span>Qty: ${item.quantity || 1}</span>
              <span>× ${formatCurrency(item.price)}</span>
            </div>
          </div>
          <div class="order-item-total">
            ${formatCurrency(itemSubtotal)}
          </div>
        </div>
      `;
    })
    .join("");

  const subtotal = Number(order.subtotal) || Number(order.total) || 0;
  const shipping = Number(order.shipping) || 0;
  const discount = Number(order.discount) || 0;
  const total = Number(order.total) || subtotal + shipping - discount;

  return `
    <article class="order-card" data-order-id="${order.orderId}">
      <!-- Header -->
      <header class="order-card-header">
        <div class="order-id-group">
          <span class="order-id-label">${order.orderId}</span>
          <span class="order-date-text">Placed on ${orderDate}</span>
        </div>
        <div class="order-badges-group">
          <span class="status-badge">✓ Confirmed & Paid</span>
          ${paymentBadge}
        </div>
      </header>

      <!-- Items -->
      <div class="order-items-wrap">
        <div class="order-items-heading">Purchased Decants (${order.items?.length || 0})</div>
        <div class="order-items-list">
          ${itemsHtml}
        </div>
      </div>

      <!-- Footer & Financials -->
      <div class="order-card-footer">
        <div class="order-shipping-summary">
          <h5>Delivery Destination</h5>
          <p class="customer-name">${customer.fullName || "Valued Customer"} • ${customer.phone || ""}</p>
          <p>${shippingAddress || "Delivery Address on file"}</p>
          <p style="font-size: 0.78rem; color: var(--orders-gold); margin-top: 6px;">Email: ${customer.email || order.userEmail || "Not specified"}</p>
        </div>

        <div class="order-pricing-summary">
          <h5>Order Summary</h5>
          <div class="pricing-table">
            <div class="pricing-row">
              <span>Subtotal</span>
              <span>${formatCurrency(subtotal)}</span>
            </div>
            ${
              discount > 0
                ? `<div class="pricing-row discount-row">
                    <span>Coupon Discount</span>
                    <span>-${formatCurrency(discount)}</span>
                  </div>`
                : ""
            }
            <div class="pricing-row">
              <span>Shipping</span>
              <span>${shipping === 0 ? "FREE" : formatCurrency(shipping)}</span>
            </div>
            <div class="pricing-row total-row">
              <span>Total Paid</span>
              <strong>${formatCurrency(total)}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="order-actions-bar">
        <button type="button" class="reorder-btn" data-reorder-id="${order.orderId}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 4v6h6"></path>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
          Re-order All Items
        </button>
        <a href="mailto:scentifymee.in@gmail.com?subject=Support%20Request%20for%20Order%20${encodeURIComponent(order.orderId)}" class="support-link">
          Need assistance with this order?
        </a>
      </div>
    </article>
  `;
}

function renderOrdersList(orders) {
  const container = document.getElementById("ordersContainer");
  if (!container) return;

  container.innerHTML = orders.map((order) => renderOrderCard(order)).join("");

  // Attach reorder listeners
  container.querySelectorAll("[data-reorder-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-reorder-id");
      handleReorder(id);
    });
  });
}

// ============================================
// RE-ORDER FUNCTIONALITY
// ============================================
function handleReorder(orderId) {
  const order = allSavedOrders.find((o) => o.orderId === orderId);
  if (!order || !Array.isArray(order.items) || !order.items.length) {
    showToast("Unable to re-order: order contents not found.");
    return;
  }

  try {
    const raw = localStorage.getItem(CART_KEY);
    let cart = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(cart)) cart = [];

    order.items.forEach((newItem) => {
      const existing = cart.find(
        (ci) => ci.productId === newItem.productId && ci.size === newItem.size
      );
      if (existing) {
        existing.quantity = (Number(existing.quantity) || 0) + (Number(newItem.quantity) || 1);
      } else {
        cart.push({
          productId: newItem.productId || `item-${Date.now()}`,
          name: newItem.name || "Fragrance Decant",
          brand: newItem.brand || "Scentifymee",
          image: newItem.image || "images/best-01.jpg",
          size: newItem.size || "3ml",
          price: Number(newItem.price) || 0,
          quantity: Math.max(1, Number(newItem.quantity) || 1),
        });
      }
    });

    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
    showToast("Fragrances added to cart! Redirecting to cart...");

    setTimeout(() => {
      window.location.href = "cart.html";
    }, 900);
  } catch (e) {
    console.error("Failed to re-order items:", e);
    showToast("Error adding items to cart.");
  }
}

let activeUnsubscribe = null;

function filterOrdersForUser(orders, user) {
  if (!user) return orders;
  const userEmail = (user.email || "").toLowerCase().trim();
  const filtered = orders.filter((order) => {
    if (order.userId && order.userId === user.uid) return true;
    if (order.userEmail && order.userEmail.toLowerCase().trim() === userEmail) return true;
    if (order.customer && order.customer.email && order.customer.email.toLowerCase().trim() === userEmail) return true;
    return false;
  });
  return filtered.length > 0 ? filtered : orders;
}

// ============================================
// MAIN CONTROLLER
// ============================================
async function updateOrdersView(user) {
  currentCustomer = user;
  allSavedOrders = loadOrdersFromStorage();

  // First render immediately from local storage
  let userOrders = filterOrdersForUser(allSavedOrders, user);
  renderUserBar(user, userOrders.length);

  if (!user && userOrders.length === 0) {
    renderAuthPrompt();
    return;
  }

  if (userOrders.length > 0) {
    renderOrdersList(userOrders);
  } else if (user) {
    renderEmptyState(true);
  }

  // If user is authenticated, query Cloud Firestore for cross-device orders
  if (user) {
    try {
      const cloudOrders = await fetchUserOrdersFromCloud(user.uid, user.email);
      if (Array.isArray(cloudOrders) && cloudOrders.length > 0) {
        // Merge cloud orders with local orders (cloud takes precedence, deduplicate by orderId)
        const orderMap = new Map();
        cloudOrders.forEach((co) => orderMap.set(co.orderId, { ...co, syncedToCloud: true }));
        allSavedOrders.forEach((lo) => {
          if (!orderMap.has(lo.orderId)) {
            orderMap.set(lo.orderId, lo);
          }
        });

        allSavedOrders = Array.from(orderMap.values());
        allSavedOrders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        localStorage.setItem(ORDERS_KEY, JSON.stringify(allSavedOrders));

        userOrders = filterOrdersForUser(allSavedOrders, user);
        renderUserBar(user, userOrders.length);
        if (userOrders.length > 0) {
          renderOrdersList(userOrders);
        }
      }

      // Sync any un-synced local orders to the cloud
      syncLocalOrdersToCloud(user).then((res) => {
        if (res && res.syncedCount > 0) {
          console.info(`Synced ${res.syncedCount} local order(s) to Cloud Firestore.`);
        }
      });

      // Attach real-time snapshot listener
      if (activeUnsubscribe) activeUnsubscribe();
      activeUnsubscribe = await subscribeToUserOrders(user.uid, (freshOrders) => {
        if (freshOrders && freshOrders.length > 0) {
          const freshMap = new Map();
          freshOrders.forEach((fo) => freshMap.set(fo.orderId, { ...fo, syncedToCloud: true }));
          allSavedOrders.forEach((lo) => {
            if (!freshMap.has(lo.orderId)) freshMap.set(lo.orderId, lo);
          });
          allSavedOrders = Array.from(freshMap.values());
          allSavedOrders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          localStorage.setItem(ORDERS_KEY, JSON.stringify(allSavedOrders));
          const updated = filterOrdersForUser(allSavedOrders, user);
          renderUserBar(user, updated.length);
          renderOrdersList(updated);
        }
      });
    } catch (e) {
      console.warn("Cloud order sync warning:", e);
    }
  }
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  const initialUser = getCurrentUser();
  updateOrdersView(initialUser);
  onAuthChange((newUser) => {
    updateOrdersView(newUser);
  });
});

