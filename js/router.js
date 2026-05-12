import { state, cleanupListeners } from './state.js';
import { $$ } from './helpers.js';
import { renderHome, renderListings, renderListing, renderMyListings, renderSell } from './listings.js';
import { renderMessages, renderConversation } from './messages.js';
import { renderUserProfile, renderEditProfile } from './profile.js';

// ── Navigate ─────────────────────────────────────────────────
export function navigate(hash) {
  if (location.hash === hash) handleRoute();
  else location.hash = hash;
}
window.navigate = navigate;

// ── Require auth ──────────────────────────────────────────────
function requireAuth(fn) {
  if (!state.user) { window.openAuth(); return; }
  fn();
}

// ── Route handler ─────────────────────────────────────────────
export async function handleRoute() {
  cleanupListeners();
  window._triggerSearch = null;

  const hash         = location.hash.slice(1) || 'home';
  const [route, param] = hash.split('/');

  // Active nav highlighting
  $$('.nav-link').forEach(a => {
    const match = a.dataset.nav === route || (route === '' && a.dataset.nav === 'home');
    a.classList.toggle('active', match);
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Dispatch
  switch (route) {
    case '':
    case 'home':        return renderHome();
    case 'products':    return renderListings('good');
    case 'services':    return renderListings('service');
    case 'listing':     return param ? renderListing(param) : navigate('#products');
    case 'sell':        return requireAuth(() => renderSell());
    case 'edit-listing':return requireAuth(() => renderSell(param));
    case 'my-listings': return requireAuth(() => renderMyListings());
    case 'messages':    return requireAuth(() => param ? renderConversation(param) : renderMessages());
    case 'user':        return param ? renderUserProfile(param) : navigate('#home');
    case 'profile':     return requireAuth(() => renderEditProfile());
    default:            renderNotFound();
  }
}

function renderNotFound() {
  document.getElementById('app').innerHTML = `
    <div class="px-4 py-24 text-center">
      <h1 class="text-4xl font-black mb-3">404</h1>
      <p class="text-ink-500 mb-6">That page doesn't exist.</p>
      <a href="#home" class="bg-scarlet-500 text-white px-7 py-3 rounded-full font-bold">Go home</a>
    </div>`;
}

window.addEventListener('hashchange', handleRoute);
