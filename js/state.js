// Global app state — imported by every module that needs it
export const state = {
  user:         null,   // Firebase Auth user object
  profile:      null,   // Firestore user document
  unsubscribes: []      // Active Firestore listeners to clean up on route change
};

export function cleanupListeners() {
  state.unsubscribes.forEach(fn => { try { fn(); } catch(e) {} });
  state.unsubscribes = [];
}
