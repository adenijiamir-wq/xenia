export const state = {
  user: null,
  profile: null,
  unsubscribes: []
};

export function cleanupListeners() {
  state.unsubscribes.forEach(fn => { try { fn(); } catch(e) {} });
  state.unsubscribes = [];
}
