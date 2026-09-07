/**
 * ============================================================
 * SCENTIFYMEE — Cloud Firestore Service
 * ============================================================
 * Handles persistent cloud storage for customer orders,
 * cross-device order retrieval, real-time snapshot updates,
 * and automatic synchronization of local device purchases.
 */

import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

const FIREBASE_APP_CDN = "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
const FIRESTORE_CDN = "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const ORDERS_STORAGE_KEY = "scentifymeeOrders";

let db = null;
let firestoreSdk = null;
let isInitializing = false;
let initPromise = null;

/**
 * Initialize Cloud Firestore modular SDK
 */
export async function getFirestoreDb() {
  if (db && firestoreSdk) return { db, sdk: firestoreSdk };
  if (!isFirebaseConfigured()) return { db: null, sdk: null };

  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const { initializeApp, getApps } = await import(FIREBASE_APP_CDN);
      const apps = getApps();
      const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);

      firestoreSdk = await import(FIRESTORE_CDN);
      db = firestoreSdk.getFirestore(app);
      return { db, sdk: firestoreSdk };
    } catch (err) {
      console.warn("Could not initialize Cloud Firestore SDK:", err);
      return { db: null, sdk: null };
    }
  })();

  return initPromise;
}

/**
 * Sanitize an order object to ensure Firestore compatibility
 */
function cleanOrderPayload(orderData) {
  return {
    orderId: String(orderData.orderId || `SCM-${Date.now()}`),
    userId: orderData.userId ? String(orderData.userId) : null,
    userEmail: orderData.userEmail ? String(orderData.userEmail).toLowerCase().trim() : "",
    authProvider: String(orderData.authProvider || "firebase"),
    customer: {
      fullName: String(orderData.customer?.fullName || ""),
      email: String(orderData.customer?.email || "").toLowerCase().trim(),
      phone: String(orderData.customer?.phone || ""),
      address1: String(orderData.customer?.address1 || ""),
      address2: String(orderData.customer?.address2 || ""),
      city: String(orderData.customer?.city || ""),
      state: String(orderData.customer?.state || ""),
      pincode: String(orderData.customer?.pincode || ""),
    },
    items: Array.isArray(orderData.items)
      ? orderData.items.map((item) => ({
          productId: String(item.productId || ""),
          name: String(item.name || "Fragrance Decant"),
          brand: String(item.brand || "Scentifymee"),
          image: String(item.image || "images/best-01.jpg"),
          size: String(item.size || "3ml"),
          quantity: Math.max(1, Number(item.quantity) || 1),
          price: Number(item.price) || 0,
        }))
      : [],
    subtotal: Number(orderData.subtotal) || 0,
    discount: Number(orderData.discount) || 0,
    shipping: Number(orderData.shipping) || 0,
    total: Number(orderData.total) || 0,
    paymentMethod: String(orderData.paymentMethod || "online"),
    paymentId: String(orderData.paymentId || ""),
    paymentStatus: String(orderData.paymentStatus || "paid"),
    status: String(orderData.status || "confirmed"),
    createdAt: orderData.createdAt || new Date().toISOString(),
    cloudSyncedAt: new Date().toISOString(),
  };
}

/**
 * Save an order to Cloud Firestore (/orders collection)
 */
export async function saveOrderToCloud(orderData) {
  if (!orderData || !orderData.orderId) {
    return { success: false, error: "Missing order data." };
  }

  try {
    const { db: firestoreDb, sdk } = await getFirestoreDb();
    if (!firestoreDb || !sdk) {
      console.info("Firestore unconfigured or unavailable, order preserved locally.");
      return { success: false, offline: true, error: "Cloud database not connected." };
    }

    const { doc, setDoc } = sdk;
    const payload = cleanOrderPayload(orderData);
    const orderDocRef = doc(firestoreDb, "orders", payload.orderId);

    await setDoc(orderDocRef, payload, { merge: true });
    return { success: true, orderId: payload.orderId };
  } catch (err) {
    console.warn("Failed to write order to Firestore:", err);
    return { success: false, error: err.message || "Failed to write to Cloud Firestore." };
  }
}

/**
 * Fetch all orders for a specific authenticated user from Cloud Firestore
 */
export async function fetchUserOrdersFromCloud(userId, userEmail) {
  if (!userId && !userEmail) return [];

  try {
    const { db: firestoreDb, sdk } = await getFirestoreDb();
    if (!firestoreDb || !sdk) return [];

    const { collection, query, where, getDocs } = sdk;
    const ordersRef = collection(firestoreDb, "orders");

    // Primary query by userId
    const q = userId
      ? query(ordersRef, where("userId", "==", String(userId)))
      : query(ordersRef, where("userEmail", "==", String(userEmail).toLowerCase().trim()));

    const snapshot = await getDocs(q);
    const cloudOrders = [];

    snapshot.forEach((docSnap) => {
      cloudOrders.push(docSnap.data());
    });

    // Sort newest first
    cloudOrders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return cloudOrders;
  } catch (err) {
    console.warn("Failed to fetch user orders from Firestore:", err);
    return [];
  }
}

/**
 * Sync any locally stored orders (from guest/device checkout) up to the user's Firestore account
 */
export async function syncLocalOrdersToCloud(user) {
  if (!user || !user.uid) return { syncedCount: 0 };

  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    const localOrders = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(localOrders) || !localOrders.length) return { syncedCount: 0 };

    const { db: firestoreDb } = await getFirestoreDb();
    if (!firestoreDb) return { syncedCount: 0 };

    let syncedCount = 0;
    const updatedLocalOrders = [];

    for (const order of localOrders) {
      const userEmail = (user.email || "").toLowerCase().trim();
      const orderEmail = (order.userEmail || order.customer?.email || "").toLowerCase().trim();

      // Check if order belongs to this user or was placed without a userId
      const isUserOrder = order.userId === user.uid || (orderEmail && orderEmail === userEmail);
      const isUnclaimed = !order.userId;

      if (isUserOrder || isUnclaimed) {
        if (!order.syncedToCloud) {
          order.userId = user.uid;
          order.userEmail = user.email || order.userEmail;
          const res = await saveOrderToCloud(order);
          if (res.success) {
            order.syncedToCloud = true;
            syncedCount++;
          }
        }
      }
      updatedLocalOrders.push(order);
    }

    if (syncedCount > 0) {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedLocalOrders));
    }

    return { syncedCount };
  } catch (err) {
    console.warn("Failed to auto-sync local orders to Firestore:", err);
    return { syncedCount: 0, error: err.message };
  }
}

/**
 * Subscribe to real-time order updates for the active user
 */
export async function subscribeToUserOrders(userId, onUpdate) {
  if (!userId || typeof onUpdate !== "function") return () => {};

  try {
    const { db: firestoreDb, sdk } = await getFirestoreDb();
    if (!firestoreDb || !sdk) return () => {};

    const { collection, query, where, onSnapshot } = sdk;
    const q = query(collection(firestoreDb, "orders"), where("userId", "==", String(userId)));

    return onSnapshot(
      q,
      (snapshot) => {
        const orders = [];
        snapshot.forEach((docSnap) => {
          orders.push(docSnap.data());
        });
        orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        onUpdate(orders);
      },
      (error) => {
        console.warn("Firestore snapshot listener error:", error);
      }
    );
  } catch (err) {
    console.warn("Failed to attach Firestore snapshot listener:", err);
    return () => {};
  }
}

