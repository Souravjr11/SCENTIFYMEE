/**
 * ============================================================
 * SCENTIFYMEE — Firebase Configuration
 * ============================================================
 * Replace the placeholder values below with your Firebase project
 * configuration found in:
 * Firebase Console -> Project Settings -> General -> Your apps -> Web app
 */

export const firebaseConfig = {
  apiKey: "AIzaSyCSYRMwyqcAFvTUJmPB7HHKQYqQ7CQBcmQ",
  authDomain: "scentify-mee.firebaseapp.com",
  projectId: "scentify-mee",
  storageBucket: "scentify-mee.firebasestorage.app",
  messagingSenderId: "114383721197",
  appId: "1:114383721197:web:60bc180c78c580de48f2e4",
  measurementId: "G-WZW06SHP5D"
};

/**
 * Checks whether the configuration has been updated with real project credentials.
 */
export function isFirebaseConfigured() {
  return (
    Boolean(firebaseConfig.apiKey) &&
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    Boolean(firebaseConfig.projectId) &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID"
  );
}
