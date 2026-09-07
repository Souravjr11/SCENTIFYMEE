const CART_KEY = 'scentifymeeCart';
const FREE_GIFT_KEY = 'scentifymeeFreeGift';
const COUPON_KEY = 'scentifymeeCoupon';
const VALID_COUPON_CODE = 'POKEMON';

const FREE_GIFT_SAMPLES = [
  'Afnan 9PM Elixir',
  'Armaf Club De Nuit Intense Man',
  'Lattafa Khamrah Qahwa',
  'Rasasi Hawas for Him',
  'Ajmal Cyan Oud',
  'French Avenue Liquid Brun',
  'Riiifs Costa De Amalfi',
  'Afnan Supremacy CE'
];

const formatPrice = (value) => `₹${Number(value).toLocaleString('en-IN')}`;

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function getCart() {
  return parseJson(localStorage.getItem(CART_KEY), []);
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCartBadge() {
  const total = getCart().reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  document.querySelectorAll('[data-cart-count]').forEach((el) => {
    el.textContent = String(total);
    el.hidden = total === 0;
  });
}

function getSelectedGiftSample() {
  const saved = localStorage.getItem(FREE_GIFT_KEY);
  if (saved && FREE_GIFT_SAMPLES.includes(saved)) return saved;
  const randomSample = FREE_GIFT_SAMPLES[Math.floor(Math.random() * FREE_GIFT_SAMPLES.length)];
  localStorage.setItem(FREE_GIFT_KEY, randomSample);
  return randomSample;
}

function getCouponCode() {
  return (localStorage.getItem(COUPON_KEY) || '').trim().toUpperCase();
}

function setCouponMessage(message, isError = false) {
  const messageEl = document.getElementById('couponMessage');
  if (!messageEl) return;

  messageEl.textContent = message;
  messageEl.classList.toggle('error', isError);
}

function bindCouponValidation() {
  const input = document.querySelector('.coupon-box input');
  const button = document.querySelector('.coupon-box button');

  if (!input || !button) return;

  const savedCoupon = getCouponCode();
  if (savedCoupon) {
    input.value = savedCoupon;
    setCouponMessage('Coupon applied successfully');
  }

  button.addEventListener('click', () => {
    const enteredCode = input.value.trim().toUpperCase();

    if (enteredCode === VALID_COUPON_CODE) {
      localStorage.setItem(COUPON_KEY, VALID_COUPON_CODE);
      setCouponMessage('Coupon applied successfully');
      renderCart();
      return;
    }

    if (!enteredCode) {
      localStorage.removeItem(COUPON_KEY);
      setCouponMessage('Only valid codes work.', true);
      renderCart();
      return;
    }

    localStorage.removeItem(COUPON_KEY);
    setCouponMessage('Not a valid coupon', true);
    input.value = '';
    renderCart();
  });
}

function renderCart() {
  const cart = getCart();
  const list = document.getElementById('cartList');
  const summary = document.getElementById('summaryBody');
  const banner = document.querySelector('.cart-banner');
  const FREE_SHIPPING_THRESHOLD = 1100;
  const FREE_GIFT_THRESHOLD = 999;
  const couponCode = getCouponCode();

  if (!list || !summary) return;

  if (!cart.length) {
    if (banner) {
      banner.innerHTML = '<span>Add <strong>₹1,100</strong> more to unlock free shipping • free 2ml sample • Choose your own gift</span>';
    }
    list.innerHTML = `
      <div class="empty-cart">
        <h2>Your cart is empty</h2>
        <p>Add a luxury fragrance to begin your order.</p>
        <a href="index.html">Continue shopping</a>
      </div>
    `;
    summary.innerHTML = `
      <div class="summary-row">
        <span class="muted">Subtotal (0 items)</span>
        <span class="value">₹0</span>
      </div>
      <div class="summary-row">
        <span class="muted">Shipping</span>
        <span class="value">₹0</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-total">
        <span>Total</span>
        <span>₹0</span>
      </div>
    `;
    return;
  }

  const subtotal = cart.reduce((sum, item) => {
    const unitPrice = Number(item.price) || 0;
    return sum + unitPrice * Number(item.quantity || 1);
  }, 0);

  const couponDiscount = couponCode === VALID_COUPON_CODE ? subtotal * 0.2 : 0;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 100;
  const total = Math.max(0, subtotal - couponDiscount + shipping);

  if (banner) {
    if (subtotal >= FREE_SHIPPING_THRESHOLD) {
      banner.innerHTML = '<span><strong>Free shipping unlocked</strong> • free 2ml sample • Choose your own gift</span>';
    } else {
      banner.innerHTML = `<span>Add <strong>${formatPrice(remainingForFreeShipping)}</strong> more to unlock free shipping • free 2ml sample • Choose your own gift</span>`;
    }
  }

  const cartItemsHtml = cart
    .map((item, index) => {
      const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
      return `
        <article class="cart-item" data-index="${index}">
          <div class="item-media">
            <img src="${item.image || 'images/best-01.jpg'}" alt="${item.name}" />
          </div>

          <div class="item-info">
            <div class="item-brand">${item.brand || 'Scentifymee'}</div>
            <h3 class="item-name">${item.name}</h3>
            <div class="item-meta">Size: ${item.size || '3ml'}<br/>${item.notes || ''}</div>
          </div>

          <div class="item-actions">
            <div class="qty-wrap">
              <button class="qty-btn" data-action="decrease" data-index="${index}" aria-label="Decrease quantity">−</button>
              <span class="qty-value">${item.quantity}</span>
              <button class="qty-btn" data-action="increase" data-index="${index}" aria-label="Increase quantity">+</button>
            </div>
            <div class="item-price">${formatPrice(itemTotal)}</div>
            <button class="item-remove" data-action="remove" data-index="${index}" aria-label="Remove item">×</button>
          </div>
        </article>
      `;
    })
    .join('');

  const freeGiftItemHtml = subtotal >= FREE_GIFT_THRESHOLD ? `
    <article class="cart-item cart-gift-item">
      <div class="item-media gift-media">
        <img src="images/best-01.jpg" alt="Free gift sample" />
      </div>
      <div class="item-info">
        <div class="item-brand">FREE GIFT</div>
        <h3 class="item-name">${getSelectedGiftSample()}</h3>
        <div class="item-meta">2ml sample • Included with your order</div>
      </div>
      <div class="item-actions">
        <div class="item-price free-gift-price">Free</div>
      </div>
    </article>
  ` : '';

  list.innerHTML = cartItemsHtml + freeGiftItemHtml;

  const giftSelectionHtml = subtotal >= FREE_GIFT_THRESHOLD ? `
    <div class="free-gift-block">
      <div class="free-gift-label">FREE GIFT <span>✓ Selected</span></div>
      <div class="gift-select-wrap">
        <select class="gift-select" aria-label="Choose free gift sample">
          ${FREE_GIFT_SAMPLES.map((sample) => `
            <option value="${sample}" ${sample === getSelectedGiftSample() ? 'selected' : ''}>${sample}</option>
          `).join('')}
        </select>
      </div>
      <div class="free-gift-note">1x ${getSelectedGiftSample()} will be added to your order</div>
    </div>
  ` : '';

  summary.innerHTML = `
    <div class="summary-row">
      <span class="muted">Subtotal (${cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)} items)</span>
      <span class="value">${formatPrice(subtotal)}</span>
    </div>
    <div class="summary-row">
      <span class="muted">Shipping</span>
      <span class="value">${formatPrice(shipping)}</span>
    </div>
    ${couponCode === VALID_COUPON_CODE ? `
      <div class="summary-row">
        <span class="muted">Coupon (-20%)</span>
        <span class="value">-${formatPrice(couponDiscount)}</span>
      </div>
    ` : ''}
    <div class="summary-divider"></div>
    <div class="summary-total">
      <span>Total</span>
      <span>${formatPrice(total)}</span>
    </div>
    ${giftSelectionHtml}
  `;

  const giftSelect = document.querySelector('.gift-select');
  if (giftSelect) {
    giftSelect.addEventListener('change', (event) => {
      localStorage.setItem(FREE_GIFT_KEY, event.target.value);
      renderCart();
    });
  }

  bindCartActions();
}

function bindCartActions() {
  document.querySelectorAll('[data-action="increase"]').forEach((button) => {
    button.addEventListener('click', () => {
      const cart = getCart();
      const index = Number(button.dataset.index);
      cart[index].quantity = (Number(cart[index].quantity) || 1) + 1;
      saveCart(cart);
      renderCart();
      updateCartBadge();
    });
  });

  document.querySelectorAll('[data-action="decrease"]').forEach((button) => {
    button.addEventListener('click', () => {
      const cart = getCart();
      const index = Number(button.dataset.index);
      const nextQty = (Number(cart[index].quantity) || 1) - 1;
      if (nextQty <= 0) {
        cart.splice(index, 1);
      } else {
        cart[index].quantity = nextQty;
      }
      saveCart(cart);
      renderCart();
      updateCartBadge();
    });
  });

  document.querySelectorAll('[data-action="remove"]').forEach((button) => {
    button.addEventListener('click', () => {
      const cart = getCart();
      const index = Number(button.dataset.index);
      cart.splice(index, 1);
      saveCart(cart);
      renderCart();
      updateCartBadge();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  updateCartBadge();
  bindCouponValidation();
});
