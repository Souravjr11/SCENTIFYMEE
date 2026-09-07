/* ============================================
   PRODUCT DATA — edit here to swap images/text
   ============================================ */
const routes = {
  home: "index.html",
  bestsellers: "bestsellers.html",
  newAdditions: "new_additions.html",
  shopAll: "all_products.html",
  partials: "partials.html",
  about: "about.html",
  faq: "faq.html",
  cart: "cart.html",
  account: "account.html",
  orders: "orders.html",
  privacy: "privacy-policy.html",
  terms: "terms.html",
  shipping: "shipping-policy.html",
  refund: "refund-policy.html",
  product: (slug) => `product.html?id=${slug}`
};

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function getCart() {
  return parseJson(localStorage.getItem("scentifymeeCart"), []);
}

function updateCartBadge() {
  const total = getCart().reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = String(total);
    el.hidden = total === 0;
  });
}

const newAdditions = [
  { brand: "GISSAH", name: "Gissah Imperial Valley", slug: "gissah-imperial-valley", notes: "Sicilian Bergamot, Pink Pepper, Davana", price: "₹299", image: "images/new-01.jpg" },
  { brand: "CHOPARD", name: "Chopard Oud Malaki", slug: "chopard-oud-malaki", notes: "Grapefruit, Lavender, Artemisia", price: "₹299", image: "images/new-02.jpg" },
  { brand: "AHMED AL MAGHRIBI", name: "Ahmed Al Maghribi Bin Shaikh", slug: "ahmed-al-maghribi-bin-shaikh", notes: "French Lavender, Saffron, Rose", price: "₹249", image: "images/new-03.jpg" },
  { brand: "FRAGRANCE WORLD", name: "Fragrance World Oud Madness", slug: "fragrance-world-oud-madness", notes: "Passionfruit, Fruity Notes, Saffron", price: "₹179", image: "images/new-04.jpg" },
  { brand: "RIIFFS", name: "Riiffs Costa De Amalfi", slug: "riiffs-costa-de-amalfi", notes: "Green Mandarin, Lemon Peel, Yuzu", price: "₹149", image: "images/new-05.jpg" },
  { brand: "ARMAF", name: "Armaf Club De Nuit Intense Man", slug: "armaf-club-de-nuit-intense-man", notes: "Pineapple, Citrus, Woody Notes", price: "₹199", image: "images/new-06.jpg" }
];

const bestSellers = [
  { brand: "AFNAN", name: "Afnan 9PM Night Out", slug: "afnan-9pm-night-out", notes: "Dragon Fruit, Bergamot, Cognac", price: "₹199", image: "images/best-01.jpg" },
  { brand: "ARABIYAT", name: "Arabiyat Prestige Marwa", slug: "arabiyat-prestige-marwa", notes: "Calabrian Bergamot, Lemon, Sicilian Notes", price: "₹179", image: "images/best-02.jpg" },
  { brand: "AFNAN", name: "Afnan Supremacy CE", slug: "afnan-supremacy-ce", notes: "Pineapple, Bergamot, Apple", price: "₹199", image: "images/best-03.jpg" },
  { brand: "ARMAF", name: "Armaf Club De Nuit Intense Man", slug: "armaf-club-de-nuit-intense-man", notes: "Lemon, Pineapple, Bergamot", price: "₹199", image: "images/best-04.jpg" },
  { brand: "FRENCH AVENUE", name: "French Avenue Liquid Brun", slug: "french-avenue-liquid-brun", notes: "Cinnamon, Cardamom, Orange", price: "₹179", image: "images/best-05.jpg" },
  { brand: "RASASI", name: "Rasasi Hawas for Him", slug: "rasasi-hawas-for-him", notes: "Apple, Bergamot, Aquatic Notes", price: "₹199", image: "images/best-06.jpg" }
];

const featuredDecants = [
  { brand: "FRENCH AVENUE", name: "French Avenue Liquid Brun", slug: "french-avenue-liquid-brun", notes: "Cinnamon, Cardamom, Orange", price: "₹179", image: "images/featured-01.jpg" },
  { brand: "AFNAN", name: "Afnan 9PM Night Out", slug: "afnan-9pm-night-out", notes: "Dragon Fruit, Bergamot, Cognac", price: "₹199", image: "images/featured-02.jpg" },
  { brand: "ARABIYAT", name: "Arabiyat Prestige Marwa", slug: "arabiyat-prestige-marwa", notes: "Calabrian Bergamot, Lemon, Sicilian Notes", price: "₹179", image: "images/featured-03.jpg" },
  { brand: "ARMAF", name: "Armaf Club De Nuit Intense Man", slug: "armaf-club-de-nuit-intense-man", notes: "Lemon, Pineapple, Bergamot", price: "₹199", image: "images/featured-04.jpg" },
  { brand: "RIIFFS", name: "Riiffs Freeze", slug: "riiffs-freeze", notes: "Lemon Zest, Spearmint, Calabrian Notes", price: "₹199", image: "images/featured-05.jpg" }
];

const testimonials = [
  "images/testimonial-1.jpg",
  "images/testimonial-2.jpg",
  "images/testimonial-3.jpg"
];

/* ============================================
   HELPERS
   ============================================ */
function slugify(str){
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function buildProductCard(product){
  const card = document.createElement("div");
  card.className = "product-card";
  const imageSrc = product.image ? (product.image.includes("?") ? product.image : `${product.image}?v=2`) : "";

  card.innerHTML = `
    <a href="product.html?id=${slugify(product.name)}" style="display:flex;flex-direction:column;height:100%;color:inherit;">
      <div class="product-image">
        <img src="${imageSrc}" alt="${product.name}" draggable="false">
      </div>
      <div class="product-info">
        <div class="product-brand">${product.brand}</div>
        <h3>${product.name}</h3>
        <p>${product.notes}</p>
        <div class="product-price">Starts from <strong>${product.price}</strong></div>
      </div>
    </a>
  `;
  return card;
}

/* ============================================
   GENERIC DRAG/SWIPE-ENABLED CAROUSEL
   ============================================ */
class Carousel{
  constructor({ track, viewport, prevBtn, nextBtn, dotsWrap, itemSelector, visibleCount }){
    this.track = track;
    this.viewport = viewport;
    this.prevBtn = prevBtn;
    this.nextBtn = nextBtn;
    this.dotsWrap = dotsWrap;
    this.itemSelector = itemSelector;
    this.visibleCountFn = visibleCount;
    this.index = 0;
    this.startX = 0;
    this.currentTranslate = 0;
    this.isDragging = false;

    this.bindEvents();
    window.addEventListener("resize", () => this.update());
  }

  get items(){
    return Array.from(this.track.querySelectorAll(this.itemSelector));
  }

  get itemWidth(){
    const item = this.items[0];
    if(!item) return 0;
    const style = getComputedStyle(this.track);
    const gap = parseFloat(style.gap) || 0;
    return item.getBoundingClientRect().width + gap;
  }

  get maxIndex(){
    const visible = this.visibleCountFn ? this.visibleCountFn() : 1;
    return Math.max(0, this.items.length - Math.floor(visible));
  }

  goTo(i){
    this.index = Math.min(Math.max(i, 0), this.maxIndex);
    const offset = -this.index * this.itemWidth;
    this.track.style.transform = `translateX(${offset}px)`;
    this.renderDots();
  }

  next(){ this.goTo(this.index + 1); }
  prev(){ this.goTo(this.index - 1); }

  renderDots(){
    if(!this.dotsWrap) return;
    this.dotsWrap.innerHTML = "";
    const total = this.maxIndex + 1;
    for(let i = 0; i < total; i++){
      const dot = document.createElement("span");
      dot.className = "dot" + (i === this.index ? " active" : "");
      dot.addEventListener("click", () => this.goTo(i));
      this.dotsWrap.appendChild(dot);
    }
  }

  update(){
    this.goTo(Math.min(this.index, this.maxIndex));
  }

  bindEvents(){
    if(this.prevBtn) this.prevBtn.addEventListener("click", () => this.prev());
    if(this.nextBtn) this.nextBtn.addEventListener("click", () => this.next());

    // Touch / drag support
    const start = (x) => {
      this.isDragging = true;
      this.startX = x;
      this.track.style.transition = "none";
      this.baseTranslate = -this.index * this.itemWidth;
    };
    const move = (x) => {
      if(!this.isDragging) return;
      const delta = x - this.startX;
      this.currentTranslate = this.baseTranslate + delta;
      this.track.style.transform = `translateX(${this.currentTranslate}px)`;
    };
    const end = () => {
      if(!this.isDragging) return;
      this.isDragging = false;
      this.track.style.transition = "";
      const delta = this.currentTranslate - this.baseTranslate;
      const threshold = this.itemWidth * 0.15;
      if(delta < -threshold) this.next();
      else if(delta > threshold) this.prev();
      else this.goTo(this.index);
    };

    this.viewport.addEventListener("touchstart", (e) => start(e.touches[0].clientX), { passive: true });
    this.viewport.addEventListener("touchmove", (e) => move(e.touches[0].clientX), { passive: true });
    this.viewport.addEventListener("touchend", end);

    this.viewport.addEventListener("mousedown", (e) => { e.preventDefault(); start(e.clientX); });
    window.addEventListener("mousemove", (e) => move(e.clientX));
    window.addEventListener("mouseup", end);
  }
}

/* ============================================
   INIT TESTIMONIAL CAROUSEL
   ============================================ */
function initTestimonials(){
  const track = document.getElementById("testimonialTrack");
  if(!track || !track.parentElement) return;

  const viewport = track.parentElement;
  track.innerHTML = testimonials.map((src) => `
    <div class="testimonial-card">
      <img src="${src}" alt="Customer testimonial" draggable="false">
    </div>
  `).join("");

  const visibleCount = () => {
    const w = window.innerWidth;
    if(w <= 600) return 1;
    if(w <= 1199) return 2;
    return 3;
  };

  const carousel = new Carousel({
    track,
    viewport,
    prevBtn: document.getElementById("testiPrev"),
    nextBtn: document.getElementById("testiNext"),
    dotsWrap: document.getElementById("testiDots"),
    itemSelector: ".testimonial-card",
    visibleCount
  });

  carousel.goTo(0);
}

/* ============================================
   INIT PRODUCT CAROUSELS
   ============================================ */
function initProductCarousel(sectionEl, data){
  const track = sectionEl.querySelector("[data-track]");
  const viewport = track.parentElement;

  data.forEach((product) => track.appendChild(buildProductCard(product)));

  const visibleCount = () => {
    const w = window.innerWidth;
    if(w <= 375) return 1.2;
    if(w <= 600) return 1.4;
    if(w <= 900) return 2.3;
    if(w <= 1199) return 3.3;
    return 5.2;
  };

  const carousel = new Carousel({
    track,
    viewport,
    prevBtn: sectionEl.querySelector('[data-action="prev"]'),
    nextBtn: sectionEl.querySelector('[data-action="next"]'),
    dotsWrap: sectionEl.querySelector("[data-dots]"),
    itemSelector: ".product-card",
    visibleCount
  });

  carousel.goTo(0);
}

/* ============================================
   MOBILE NAV TOGGLE
   ============================================ */
function initMobileNav(){
  const overlay = document.getElementById("mobileNavOverlay");
  const openBtn = document.getElementById("hamburgerBtn");
  const closeBtn = document.getElementById("mobileNavClose");

  if(!overlay || !openBtn || !closeBtn) return;

  const open = () => overlay.classList.add("open");
  const close = () => overlay.classList.remove("open");

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if(e.target === overlay) close();
  });

  overlay.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", close);
  });
}

/* ============================================
   FLOATING BUTTON — scroll to top
   ============================================ */
function initFloatingBtn(){
  const btn = document.getElementById("floatingBtn");
  if(!btn) return;

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ============================================
   BOOT
   ============================================ */
document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  initTestimonials();

  const sections = document.querySelectorAll(".product-carousel-wrap");
  sections.forEach((wrap) => {
    const key = wrap.dataset.carousel;
    const sectionEl = wrap.parentElement;
    const dataMap = { newAdditions, bestSellers, featuredDecants };
    if(sectionEl && dataMap[key]) {
      initProductCarousel(sectionEl, dataMap[key]);
    }
  });

  initMobileNav();
  initFloatingBtn();
});
/* ============================================================
   ROUTES — centralised so URLs only need to change in one place
   ============================================================ */
// Shared route map lives above and is intentionally kept as the single source of truth.

/* ============================================================
   PRODUCT DATABASE — single source of truth.
   Reusable later by bestsellers/shop-all/new-additions/partials/product.html
   ============================================================ */
function slugify(str){
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const RAW_PRODUCTS = [
  { brand: "AFNAN", name: "Afnan 9PM Night Out", notes: "Dragon Fruit, Bergamot, Cognac", price: 199, fragranceFamily: "Oriental", season: "All Season" },
  { brand: "ARABIYAT", name: "Arabiyat Prestige Marwa", notes: "Calabrian Bergamot, Lemon, Sicilian Orange", price: 179, fragranceFamily: "Citrus", season: "Spring" },
  { brand: "AFNAN", name: "Afnan Supremacy CE", notes: "Pineapple, Bergamot, Apple", price: 199, fragranceFamily: "Fresh", season: "Summer" },
  { brand: "ARMAF", name: "Armaf Club De Nuit Intense Man", notes: "Lemon, Pineapple, Bergamot", price: 199, fragranceFamily: "Citrus", season: "Summer" },
  { brand: "FRENCH AVENUE", name: "French Avenue Liquid Brun", notes: "Cinnamon, Cardamom, Orange Blossom", price: 179, fragranceFamily: "Spicy", season: "Winter" },
  { brand: "RASASI", name: "Rasasi Hawas for Him", notes: "Apple, Bergamot, Lemon", price: 179, fragranceFamily: "Fresh", season: "All Season" },
  { brand: "RIIFFS", name: "Riiffs Freeze", notes: "Lemon Zest, Spearmint, Calabrian Bergamot", price: 199, fragranceFamily: "Aquatic", season: "Summer" },
  { brand: "AHMED AL MAGHRIBI", name: "Ahmed Al Maghribi Kaaf", notes: "Lavender, Watermelon, Sicilian Orange", price: 169, fragranceFamily: "Floral", season: "Spring" },
  { brand: "LATTAFA", name: "Lattafa Teriaq Intense", notes: "Saffron, Bergamot, Intense Plum Liquor", price: 219, fragranceFamily: "Oriental", season: "Winter" },
  { brand: "RAYHAAN", name: "Rayhaan Obsidian", notes: "Iris, Citrus, Leather", price: 179, fragranceFamily: "Woody", season: "Autumn" },
  { brand: "AHMED AL MAGHRIBI", name: "Ahmed Al Maghribi Blue", notes: "Grapefruit, Lemon, Mint", price: 179, fragranceFamily: "Fresh", season: "Summer" },
  { brand: "KHADLAJ", name: "Khadlaj Island Dreams", notes: "Ginger, Bergamot, Grapefruit", price: 149, fragranceFamily: "Citrus", season: "Spring" },
  { brand: "AJMAL", name: "Ajmal Cyan Oud", notes: "Bergamot, Lemon, Marine", price: 179, fragranceFamily: "Aquatic", season: "Summer" },
  { brand: "RAYHAAN", name: "Rayhaan Nocturno Elixir", notes: "Bergamot, Black Pepper, Mint", price: 199, fragranceFamily: "Spicy", season: "Autumn" },
  { brand: "RAYHAAN", name: "Rayhaan Aquatica", notes: "Lime, Bergamot, Mandarin", price: 199, fragranceFamily: "Aquatic", season: "Summer" },
  { brand: "LATTAFA", name: "Lattafa Fakhar", notes: "Peach, Pear, Orange", price: 199, fragranceFamily: "Sweet", season: "Spring" },
  { brand: "AFNAN", name: "Afnan 9PM", notes: "Apple, Cinnamon, Wild Lavender", price: 199, fragranceFamily: "Spicy", season: "Winter" },
  { brand: "AHMED AL MAGHRIBI", name: "Ahmed Al Maghribi Marj", notes: "Bergamot, Pink Pepper, Tangerine", price: 299, fragranceFamily: "Citrus", season: "Spring" },
  { brand: "AJMAL", name: "Ajmal Kuro", notes: "Bergamot, Pepper, Geranium", price: 199, fragranceFamily: "Woody", season: "Autumn" },
  { brand: "RAYHAAN", name: "Rayhaan Elixir", notes: "Cool Mint, Bergamot, Lavender", price: 179, fragranceFamily: "Fresh", season: "Summer" },
  { brand: "RIIFFS", name: "Riiffs Fareed", notes: "Cardamom, Pepper, Lavender", price: 149, fragranceFamily: "Spicy", season: "Winter" },
  { brand: "AFNAN", name: "Afnan Supremacy Not Only Intense", notes: "Bergamot, Apple, Black Currant", price: 199, fragranceFamily: "Sweet", season: "All Season" },
  { brand: "MYKONOS", name: "Mykonos Reflection", notes: "Grapefruit, Ginger, Bergamot", price: 229, fragranceFamily: "Citrus", season: "Summer" },
  { brand: "AHMED AL MAGHRIBI", name: "Ahmed Al Maghribi Kaaf Noir", notes: "Blood Orange, Sicilian Lemon, Juniper Berries", price: 179, fragranceFamily: "Woody", season: "Autumn" },
  { brand: "AHMED AL MAGHRIBI", name: "Ahmed Al Maghribi Summer Oud", notes: "Saffron, Incense, Mandarin", price: 199, fragranceFamily: "Oriental", season: "Summer" },
  { brand: "AFNAN", name: "Afnan Rare Reef", notes: "BlackCurrant, Orange, Citron", price: 179, fragranceFamily: "Sweet", season: "Spring" },
  { brand: "LATTAFA", name: "Lattafa Hayati Al-Maleky", notes: "Pink Pepper, Bergamot, Ginger", price: 149, fragranceFamily: "Spicy", season: "Winter" },
  { brand: "LATTAFA", name: "Lattafa Velvet Oud", notes: "Cardamom, Bergamot, Violet Leaf", price: 179, fragranceFamily: "Woody", season: "Autumn" },
  { brand: "AHMED AL MAGHRIBI", name: "Ahmed Al Maghribi Bin Shaikh", notes: "French Lavender, Saffron, Rose", price: 249, fragranceFamily: "Floral", season: "Spring" },
  { brand: "GISSAH", name: "Gissah Imperial Valley", notes: "Sicilian Bergamot, Pink Pepper, Davana", price: 299, fragranceFamily: "Oriental", season: "Autumn" },
  { brand: "DAVIDOFF", name: "Davidoff Cool Water", notes: "Peppermint, Lavender, Green Nuances", price: 129, fragranceFamily: "Fresh", season: "Summer" },
  { brand: "LATTAFA", name: "Lattafa Najdia", notes: "Bergamot, Lemongrass, Apple", price: 129, fragranceFamily: "Citrus", season: "Spring" },
  { brand: "RUE BROCA", name: "Rue Broca Theoreme", notes: "Bergamot, Citruses, Amber", price: 149, fragranceFamily: "Woody", season: "Autumn" },
  { brand: "LATTAFA", name: "Lattafa Khamrah Qahwa", notes: "Cinnamon, Cardamom, Ginger", price: 149, fragranceFamily: "Spicy", season: "Winter" },
  { brand: "RIIFFS", name: "Riiffs Costa De Amalfi", notes: "Green Mandarin, Lemon Peel, Yuzu", price: 149, fragranceFamily: "Citrus", season: "Summer" },
  { brand: "ARMAF", name: "Armaf Club De Nuit Intense Man Overdose", notes: "Pineapple, Blue Crystal, Tangerine", price: 229, fragranceFamily: "Fresh", season: "Summer" },
  { brand: "REEF", name: "Reef 33", notes: "Indian Saffron, Rosemary, Agarwood (Oud)", price: 229, fragranceFamily: "Woody", season: "Winter" },
  { brand: "RAYHAAN", name: "Rayhaan Azul", notes: "Lemon, Bergamot, Marine Notes", price: 149, fragranceFamily: "Aquatic", season: "Summer" },
  { brand: "MYKONOS", name: "Mykonos Sorrento", notes: "Watermelon, Citrus, Mint", price: 179, fragranceFamily: "Fresh", season: "Summer" },
  { brand: "TURATHI", name: "Turathi Blue", notes: "Saffron, Oud, Amber", price: 199, fragranceFamily: "Oriental", season: "Winter" },
  { brand: "CHOPARD", name: "Chopard Oud Malaki", notes: "Grapefruit, Lavender, Artemisia", price: 299, fragranceFamily: "Woody", season: "Autumn" },
  { brand: "FRAGRANCE WORLD", name: "Fragrance World Oud Madness", notes: "Passionfruit, Fruity Notes, Saffron", price: 179, fragranceFamily: "Sweet", season: "Autumn" },
  { brand: "LATTAFA", name: "Lattafa Najdia Tribute", notes: "Ginger, Mandarin Orange, Apple", price: 149, fragranceFamily: "Citrus", season: "Spring" },
  { brand: "CHOPARD", name: "Chopard Oud Limited Edition", notes: "Saffron, Oud, Sandalwood", price: 279, fragranceFamily: "Woody", season: "Winter" }
];

const products = RAW_PRODUCTS.map((p, i) => {
  const id = i + 1;
  const idx = String(id).padStart(2, "0");
  return {
    id,
    slug: slugify(p.name),
    brand: p.brand,
    name: p.name,
    notes: p.notes,
    price: p.price,
    category: "bestseller",
    fragranceFamily: p.fragranceFamily,
    season: p.season,
    description: "",
    sizes: [],
    images: [
      `images/products/${idx}-1.jpg`,
      `images/products/${idx}-2.jpg`
    ],
    stock: true
  };
});

const TOTAL_PRODUCTS = products.length; // 44

/* ============================================================
   FILTER DEFINITIONS
   ============================================================ */
const FILTER_GROUPS = [
  { key: "fragranceFamily", label: "Fragrance Family", options: ["Woody", "Fresh", "Citrus", "Floral", "Oriental", "Aquatic", "Sweet", "Spicy"] },
  { key: "brand", label: "Brand", options: [...new Set(products.map(p => p.brand))].sort() },
  { key: "season", label: "Season", options: ["Summer", "Winter", "Spring", "Autumn", "All Season"] }
];

/* ============================================================
   STATE
   ============================================================ */
const PER_PAGE = 30;

const state = {
  filters: { fragranceFamily: new Set(), brand: new Set(), season: new Set() },
  sort: "bestsellers",
  page: 1,
  searchQuery: ""
};

/* ============================================================
   URL STATE
   ============================================================ */
function readStateFromURL(){
  const params = new URLSearchParams(window.location.search);
  const page = parseInt(params.get("page"), 10);
  if(page && page > 0) state.page = page;

  const sort = params.get("sort");
  if(sort) state.sort = sort;

  FILTER_GROUPS.forEach(group => {
    const val = params.get(group.key);
    if(val){
      val.split(",").forEach(v => {
        const match = group.options.find(o => slugify(o) === v);
        if(match) state.filters[group.key].add(match);
      });
    }
  });
}

function writeStateToURL(){
  const params = new URLSearchParams();

  FILTER_GROUPS.forEach(group => {
    const set = state.filters[group.key];
    if(set.size){
      params.set(group.key, [...set].map(slugify).join(","));
    }
  });

  if(state.sort !== "bestsellers") params.set("sort", state.sort);
  if(state.page !== 1) params.set("page", state.page);

  const query = params.toString();
  const newUrl = window.location.pathname + (query ? `?${query}` : "");
  history.pushState({}, "", newUrl);
}

/* ============================================================
   FILTERING
   ============================================================ */
function getFilteredProducts(){
  let list = products;

  if(state.searchQuery){
    const q = state.searchQuery.toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.notes.toLowerCase().includes(q)
    );
  }

  FILTER_GROUPS.forEach(group => {
    const set = state.filters[group.key];
    if(set.size){
      list = list.filter(p => set.has(p[group.key]));
    }
  });

  return list;
}

function getCurrentPageName(){
  const page = window.location.pathname.split('/').pop() || "index.html";
  return page.toLowerCase();
}

function getPagePriorityOrder(list){
  const page = getCurrentPageName();

  if(page === "new_additions.html" || page === "new-additions.html"){
    const prioritySlugs = newAdditions.map(p => slugify(p.name));
    const priority = [];
    const seen = new Set();

    prioritySlugs.forEach(slug => {
      const product = list.find(p => p.slug === slug);
      if(product && !seen.has(product.slug)){
        priority.push(product);
        seen.add(product.slug);
      }
    });

    const remainder = list.filter(product => !seen.has(product.slug));
    return [...priority, ...remainder];
  }

  if(page === "all_products.html" || page === "shop-all.html"){
    const shuffled = [...list];
    for(let i = shuffled.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  return [...list];
}

/* ============================================================
   SORTING
   ============================================================ */
function getSortedProducts(list){
  const sorted = [...list];

  if(state.sort === "bestsellers"){
    return getPagePriorityOrder(sorted);
  }

  switch(state.sort){
    case "price-asc": sorted.sort((a, b) => a.price - b.price); break;
    case "price-desc": sorted.sort((a, b) => b.price - a.price); break;
    case "name-asc": sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
    case "name-desc": sorted.sort((a, b) => b.name.localeCompare(a.name)); break;
    case "newest": sorted.sort((a, b) => b.id - a.id); break;
    default: return getPagePriorityOrder(sorted);
  }

  return sorted;
}

/* ============================================================
   PAGINATION
   ============================================================ */
function paginate(list){
  const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  if(state.page > totalPages) state.page = totalPages;
  if(state.page < 1) state.page = 1;
  const start = (state.page - 1) * PER_PAGE;
  return {
    pageItems: list.slice(start, start + PER_PAGE),
    totalPages
  };
}

function renderPagination(totalPages){
  const el = document.getElementById("pagination");
  el.innerHTML = "";

  const prevBtn = document.createElement("button");
  prevBtn.className = "page-btn";
  prevBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`;
  prevBtn.disabled = state.page <= 1;
  prevBtn.addEventListener("click", () => goToPage(state.page - 1));
  el.appendChild(prevBtn);

  for(let i = 1; i <= totalPages; i++){
    const btn = document.createElement("button");
    btn.className = "page-btn" + (i === state.page ? " active" : "");
    btn.textContent = i;
    btn.addEventListener("click", () => goToPage(i));
    el.appendChild(btn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.className = "page-btn";
  nextBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
  nextBtn.disabled = state.page >= totalPages;
  nextBtn.addEventListener("click", () => goToPage(state.page + 1));
  el.appendChild(nextBtn);
}

function goToPage(page){
  state.page = page;
  render();
  writeStateToURL();
  document.querySelector(".product-grid-wrap").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ============================================================
   PRODUCT IMAGE CAROUSEL (inside each card)
   ============================================================ */
function getProductImageList(product){
  const bust = (url) => url ? (url.includes("?") ? url : `${url}?v=2`) : "";
  if(Array.isArray(product.images) && product.images.length) return product.images.map(bust);
  if(product.image) return [bust(product.image)];
  return [];
}

function buildImageCarousel(product){
  const wrap = document.createElement("div");
  wrap.className = "product-image";

  const productImages = getProductImageList(product);
  const img = document.createElement("img");
  img.src = productImages[0] || "";
  img.alt = product.name || "Product image";
  img.draggable = false;
  wrap.appendChild(img);

  let current = 0;

  if(productImages.length > 1){
    const prevArrow = document.createElement("button");
    prevArrow.className = "img-arrow left";
    prevArrow.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`;
    prevArrow.setAttribute("aria-label", "Previous image");

    const nextArrow = document.createElement("button");
    nextArrow.className = "img-arrow right";
    nextArrow.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
    nextArrow.setAttribute("aria-label", "Next image");

    const dotsWrap = document.createElement("div");
    dotsWrap.className = "img-dots";
    productImages.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.className = "img-dot" + (i === 0 ? " active" : "");
      dotsWrap.appendChild(dot);
    });

    function update(){
      img.src = productImages[current];
      [...dotsWrap.children].forEach((d, i) => d.classList.toggle("active", i === current));
    }

    prevArrow.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      current = (current - 1 + productImages.length) % productImages.length;
      update();
    });

    nextArrow.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      current = (current + 1) % productImages.length;
      update();
    });

    wrap.appendChild(prevArrow);
    wrap.appendChild(nextArrow);
    wrap.appendChild(dotsWrap);
  }

  return wrap;
}

/* ============================================================
   PRODUCT CARD
   ============================================================ */
function buildProductCard(product){
  const card = document.createElement("div");
  card.className = "product-card";

  const link = document.createElement("a");
  link.className = "product-card-link";
  link.href = routes.product(product.slug || slugify(product.name));

  link.appendChild(buildImageCarousel(product));

  const info = document.createElement("div");
  info.className = "product-info";
  const prettyPrice = typeof product.price === "number" ? `₹${product.price}` : product.price;
  info.innerHTML = `
    <div class="product-brand">${product.brand}</div>
    <h3>${product.name}</h3>
    <p>${product.notes}</p>
    <div class="product-price">Starts from <strong>${prettyPrice}</strong></div>
  `;
  link.appendChild(info);

  card.appendChild(link);
  return card;
}

/* ============================================================
   RENDERING
   ============================================================ */
function render(){
  const filtered = getFilteredProducts();
  const sorted = getSortedProducts(filtered);
  const { pageItems, totalPages } = paginate(sorted);

  const grid = document.getElementById("productGrid");
  grid.innerHTML = "";

  if(pageItems.length === 0){
    const empty = document.createElement("div");
    empty.className = "no-results";
    empty.textContent = "No decants match your filters. Try clearing a few.";
    grid.appendChild(empty);
  } else {
    pageItems.forEach(p => grid.appendChild(buildProductCard(p)));
  }

  document.getElementById("resultsCount").textContent =
    `Showing ${pageItems.length} of ${TOTAL_PRODUCTS}`;

  renderPagination(totalPages);
  document.getElementById("sortSelect").value = state.sort;
}

/* ============================================================
   FILTER SIDEBAR / DRAWER RENDERING
   ============================================================ */
function buildFilterGroup(group, containerSuffix){
  const wrapper = document.createElement("div");
  wrapper.className = "filter-group";
  wrapper.dataset.group = group.key;

  const head = document.createElement("button");
  head.className = "filter-group-head";
  head.innerHTML = `<span>${group.label}</span><span class="chevron"></span>`;
  head.addEventListener("click", () => wrapper.classList.toggle("open"));

  const optionsWrap = document.createElement("div");
  optionsWrap.className = "filter-options";

  group.options.forEach(option => {
    const label = document.createElement("label");
    label.className = "filter-option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = option;
    checkbox.checked = state.filters[group.key].has(option);
    checkbox.dataset.group = group.key;
    checkbox.dataset.container = containerSuffix;

    checkbox.addEventListener("change", () => {
      if(checkbox.checked) state.filters[group.key].add(option);
      else state.filters[group.key].delete(option);
      syncFilterCheckboxes();
      state.page = 1;
      render();
      writeStateToURL();
    });

    const span = document.createElement("span");
    span.textContent = option;

    label.appendChild(checkbox);
    label.appendChild(span);
    optionsWrap.appendChild(label);
  });

  wrapper.appendChild(head);
  wrapper.appendChild(optionsWrap);
  return wrapper;
}

function renderFilterGroups(){
  const desktopContainer = document.getElementById("filterGroupsDesktop");
  const mobileContainer = document.getElementById("filterGroupsMobile");
  desktopContainer.innerHTML = "";
  mobileContainer.innerHTML = "";

  FILTER_GROUPS.forEach(group => {
    desktopContainer.appendChild(buildFilterGroup(group, "desktop"));
    mobileContainer.appendChild(buildFilterGroup(group, "mobile"));
  });
}

// Keep desktop + mobile checkbox sets visually in sync since they mirror the same state
function syncFilterCheckboxes(){
  document.querySelectorAll("input[type=checkbox][data-group]").forEach(cb => {
    cb.checked = state.filters[cb.dataset.group].has(cb.value);
  });
}

function clearAllFilters(){
  FILTER_GROUPS.forEach(group => state.filters[group.key].clear());
  state.page = 1;
  syncFilterCheckboxes();
  render();
  writeStateToURL();
}

/* ============================================================
   SORT DROPDOWN
   ============================================================ */
function initSortDropdown(){
  const select = document.getElementById("sortSelect");
  select.value = state.sort;
  select.addEventListener("change", () => {
    state.sort = select.value;
    state.page = 1;
    render();
    writeStateToURL();
  });
}

/* ============================================================
   CLEAR ALL BUTTONS
   ============================================================ */
function initClearAllButtons(){
  document.querySelectorAll("[data-clear-all]").forEach(btn => {
    btn.addEventListener("click", clearAllFilters);
  });
}

/* ============================================================
   MOBILE FILTER DRAWER
   ============================================================ */
function initMobileFilterDrawer(){
  const overlay = document.getElementById("filterDrawerOverlay");
  const openBtn = document.getElementById("mobileFiltersBtn");
  const closeBtn = document.getElementById("filterDrawerClose");
  const applyBtn = document.getElementById("applyFiltersBtn");

  openBtn.addEventListener("click", () => overlay.classList.add("open"));
  closeBtn.addEventListener("click", () => overlay.classList.remove("open"));
  applyBtn.addEventListener("click", () => overlay.classList.remove("open"));
  overlay.addEventListener("click", (e) => {
    if(e.target === overlay) overlay.classList.remove("open");
  });
}

/* ============================================================
   HEADER SEARCH
   ============================================================ */
function initSearch(){
  const toggle = document.getElementById("searchToggle");
  const panel = document.getElementById("searchPanel");
  const input = document.getElementById("searchInput");
  const closeBtn = document.getElementById("searchClose");
  const resultsWrap = document.getElementById("searchResults");

  function open(){
    panel.classList.add("open");
    setTimeout(() => input.focus(), 200);
  }
  function close(){
    panel.classList.remove("open");
    input.value = "";
    resultsWrap.innerHTML = "";
  }

  toggle.addEventListener("click", () => {
    panel.classList.contains("open") ? close() : open();
  });
  closeBtn.addEventListener("click", close);

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    resultsWrap.innerHTML = "";
    if(!q){ return; }

    const matches = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.notes.toLowerCase().includes(q)
    ).slice(0, 8);

    if(matches.length === 0){
      const empty = document.createElement("div");
      empty.className = "search-empty";
      empty.textContent = `No results for "${input.value}"`;
      resultsWrap.appendChild(empty);
      return;
    }

    matches.forEach(p => {
      const item = document.createElement("a");
      item.className = "search-result-item";
      item.href = routes.product(p.slug);
      item.innerHTML = `
        <img src="${p.images[0]}?v=2" alt="${p.name}">
        <div>
          <div class="sr-brand">${p.brand}</div>
          <div class="sr-name">${p.name}</div>
        </div>
      `;
      resultsWrap.appendChild(item);
    });
  });
}

/* ============================================================
   MOBILE NAV
   ============================================================ */
function initMobileNav(){
  const overlay = document.getElementById("mobileNavOverlay");
  const openBtn = document.getElementById("hamburgerBtn");
  const closeBtn = document.getElementById("mobileNavClose");

  openBtn.addEventListener("click", () => overlay.classList.add("open"));
  closeBtn.addEventListener("click", () => overlay.classList.remove("open"));
  overlay.addEventListener("click", (e) => {
    if(e.target === overlay) overlay.classList.remove("open");
  });
}

/* ============================================================
   FLOATING BUTTON
   ============================================================ */
function initFloatingBtn(){
  const btn = document.getElementById("floatingBtn");
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const hasProductFilters = Boolean(document.getElementById("filterGroupsDesktop"));
  const hasSearch = Boolean(document.getElementById("searchToggle"));
  const hasMobileNav = Boolean(document.getElementById("hamburgerBtn"));
  const hasFloatingBtn = Boolean(document.getElementById("floatingBtn"));

  if(hasProductFilters){
    readStateFromURL();
    renderFilterGroups();
    syncFilterCheckboxes();
    initSortDropdown();
    initClearAllButtons();
    initMobileFilterDrawer();
    render();

    window.addEventListener("popstate", () => {
      readStateFromURL();
      syncFilterCheckboxes();
      render();
    });
  }

  if(hasSearch) initSearch();
  if(hasMobileNav) initMobileNav();
  if(hasFloatingBtn) initFloatingBtn();
});