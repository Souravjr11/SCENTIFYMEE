/**
 * ============================================================
 * SCENTIFYMEE — Firebase Authentication Service
 * ============================================================
 * Handles Google OAuth, Email/Password sign in, registration,
 * session monitoring, and user state synchronization.
 */

import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

let auth = null;
let googleProvider = null;
let currentAuthUser = null;
const authListeners = new Set();
const STORAGE_USER_KEY = "scentifymeeUser";

export const isDemoMode = !isFirebaseConfigured();

function normalizeUser(firebaseUser) {
  if (!firebaseUser) return null;
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || "",
    displayName:
      firebaseUser.displayName ||
      (firebaseUser.email ? firebaseUser.email.split("@")[0] : "Fragrance Connoisseur"),
    photoURL: firebaseUser.photoURL || null,
    providerId: firebaseUser.providerData?.[0]?.providerId || "firebase",
    emailVerified: Boolean(firebaseUser.emailVerified),
  };
}

function notifyListeners(user) {
  currentAuthUser = user;
  if (user) {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_USER_KEY);
  }
  authListeners.forEach((listener) => {
    try {
      listener(user);
    } catch (e) {
      console.error("Auth listener error:", e);
    }
  });
}

/**
 * Initialize Firebase Auth SDK or fall back to demo auth if unconfigured
 */
async function initializeAuthService() {
  if (!isDemoMode) {
    try {
      const { initializeApp, getApps } = await import(
        "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"
      );
      const {
        getAuth,
        GoogleAuthProvider,
        onAuthStateChanged,
      } = await import(
        "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"
      );

      const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
      auth = getAuth(app);
      googleProvider = new GoogleAuthProvider();
      googleProvider.setCustomParameters({ prompt: "select_account" });

      onAuthStateChanged(auth, (user) => {
        const norm = normalizeUser(user);
        notifyListeners(norm);
      });
      // Initialize Google Analytics if supported
      try {
        const { getAnalytics, isSupported } = await import(
          "https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js"
        );
        if (await isSupported()) {
          getAnalytics(app);
        }
      } catch (e) {
        // Analytics is non-blocking
      }

      return;
    } catch (err) {
      console.warn("Failed to load Firebase from CDN, switching to local auth:", err);
    }
  }

  // Demo / Local development mode
  console.info(
    "Scentifymee Auth: Running in demo mode. Configure firebase-config.js with your Firebase Console keys for live Google Auth."
  );
  try {
    const cached = localStorage.getItem(STORAGE_USER_KEY);
    if (cached) {
      currentAuthUser = JSON.parse(cached);
    }
  } catch (e) {
    currentAuthUser = null;
  }
  setTimeout(() => notifyListeners(currentAuthUser), 50);
}

// Start initialization immediately
const initPromise = initializeAuthService();

/**
 * Subscribe to authentication state changes
 */
export function onAuthChange(callback) {
  authListeners.add(callback);
  // Immediate call with current state
  if (currentAuthUser !== undefined) {
    callback(currentAuthUser);
  }
  return () => authListeners.delete(callback);
}

/**
 * Get current authenticated user (synchronous)
 */
export function getCurrentUser() {
  if (currentAuthUser) return currentAuthUser;
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Sign in with Google Popup
 */
export async function loginWithGoogle() {
  await initPromise;

  if (!isDemoMode && auth && googleProvider) {
    try {
      const { signInWithPopup } = await import(
        "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"
      );
      const result = await signInWithPopup(auth, googleProvider);
      const user = normalizeUser(result.user);
      notifyListeners(user);
      return { success: true, user };
    } catch (error) {
      console.error("Google sign-in error:", error);
      let friendlyMessage = "Google Sign-In failed. Please try again.";
      if (error.code === "auth/popup-closed-by-user") {
        friendlyMessage = "Sign-in popup was closed before completing.";
      } else if (error.code === "auth/cancelled-popup-request") {
        friendlyMessage = "Only one sign-in window can be open at a time.";
      } else if (error.code === "auth/unauthorized-domain") {
        friendlyMessage =
          "This domain is not authorized in Firebase Console (Authentication > Settings > Authorized domains).";
      } else if (error.code === "auth/network-request-failed") {
        friendlyMessage = "Network error. Please check your internet connection.";
      } else if (error.message) {
        friendlyMessage = error.message;
      }
      return { success: false, error: friendlyMessage, code: error.code };
    }
  }

  // Demo fallback Google login
  const demoUser = {
    uid: "google-demo-" + Date.now().toString(36),
    email: "scent.lover@example.com",
    displayName: "Scent Connoisseur (Google Demo)",
    photoURL: null,
    providerId: "google.com",
    emailVerified: true,
  };
  notifyListeners(demoUser);
  return { success: true, user: demoUser, isDemo: true };
}

/**
 * Sign in with Email and Password
 */
export async function loginWithEmail(email, password) {
  await initPromise;

  if (!email || !password) {
    return { success: false, error: "Please provide both email and password." };
  }

  if (!isDemoMode && auth) {
    try {
      const { signInWithEmailAndPassword } = await import(
        "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"
      );
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = normalizeUser(result.user);
      notifyListeners(user);
      return { success: true, user };
    } catch (error) {
      console.error("Email sign-in error:", error);
      let friendlyMessage = "Invalid email or password.";
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        friendlyMessage = "Invalid email or password.";
      } else if (error.code === "auth/invalid-email") {
        friendlyMessage = "Please enter a valid email address.";
      } else if (error.code === "auth/too-many-requests") {
        friendlyMessage = "Too many unsuccessful attempts. Please reset your password or try again later.";
      }
      return { success: false, error: friendlyMessage, code: error.code };
    }
  }

  // Demo fallback
  const user = {
    uid: "email-demo-" + btoa(email.trim()).replace(/=/g, "").slice(0, 10),
    email: email.trim(),
    displayName: email.split("@")[0],
    photoURL: null,
    providerId: "password",
    emailVerified: false,
  };
  notifyListeners(user);
  return { success: true, user, isDemo: true };
}

/**
 * Create a new account with Email, Password and Display Name
 */
export async function registerWithEmail(email, password, displayName) {
  await initPromise;

  if (!email || !password) {
    return { success: false, error: "Please fill in all required fields." };
  }
  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  if (!isDemoMode && auth) {
    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import(
        "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"
      );
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName && displayName.trim()) {
        try {
          await updateProfile(result.user, { displayName: displayName.trim() });
        } catch (e) {
          console.warn("Could not update display name:", e);
        }
      }
      const user = normalizeUser({
        ...result.user,
        displayName: displayName || result.user.displayName,
      });
      notifyListeners(user);
      return { success: true, user };
    } catch (error) {
      console.error("Registration error:", error);
      let friendlyMessage = "Registration failed. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        friendlyMessage = "An account with this email already exists.";
      } else if (error.code === "auth/invalid-email") {
        friendlyMessage = "Please enter a valid email address.";
      } else if (error.code === "auth/weak-password") {
        friendlyMessage = "Password is too weak. Please use at least 6 characters.";
      }
      return { success: false, error: friendlyMessage, code: error.code };
    }
  }

  // Demo fallback
  const user = {
    uid: "email-demo-" + Date.now().toString(36),
    email: email.trim(),
    displayName: (displayName && displayName.trim()) || email.split("@")[0],
    photoURL: null,
    providerId: "password",
    emailVerified: false,
  };
  notifyListeners(user);
  return { success: true, user, isDemo: true };
}

/**
 * Sign out user
 */
export async function logoutUser() {
  await initPromise;

  if (!isDemoMode && auth) {
    try {
      const { signOut } = await import(
        "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"
      );
      await signOut(auth);
    } catch (e) {
      console.warn("Firebase signout error:", e);
    }
  }

  notifyListeners(null);
  return { success: true };
}
