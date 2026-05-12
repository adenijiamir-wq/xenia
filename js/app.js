// ── Entry point — loaded as ES module from index.html ────────
import { state } from './state.js';
import { avatarHtml, toast, $ } from './helpers.js';
import { initAuthObserver, openAuth, watchUnread } from './auth.js';
import { handleRoute, navigate } from './router.js';

// ── Avatar refresh (called after profile save) ────────────────
function refreshAvatar() {
  const wrap = document.getElementById('navAvatarWrap');
  if (!wrap) return;
  if (state.user && state.profile) {
    wrap.outerHTML = `<div id="navAvatarWrap">${avatarHtml(state.profile, 'sm')}</div>`;
  } else {
    wrap.outerHTML = `<div id="navAvatarWrap" class="w-8 h-8 rounded-full bg-ink-200 flex items-center justify-center text-ink-600 font-semibold text-sm">?</div>`;
  }
}
window.refreshAvatar = refreshAvatar;

// ── User dropdown ────────────────────────────────────────────
function buildUserMenu() {
  const menu = document.getElementById('userMenu');
  if (!menu) return;

  if (state.user && state.profile) {
    menu.innerHTML = `
      <a href="#user/${state.user.uid}" onclick="closeUserMenu()" class="block px-4 py-3 hover:bg-ink-50 border-b border-ink-100">
        <p class="font-semibold text-sm truncate">${state.profile.displayName ?? ''}</p>
        <p class="text-xs text-ink-400 truncate">${state.user.email ?? ''}</p>
      </a>
      <a href="#my-listings" onclick="closeUserMenu()" class="block px-4 py-2.5 hover:bg-ink-50 text-sm">My listings</a>
      <a href="#messages"    onclick="closeUserMenu()" class="block px-4 py-2.5 hover:bg-ink-50 text-sm">Messages</a>
      <a href="#profile"     onclick="closeUserMenu()" class="block px-4 py-2.5 hover:bg-ink-50 text-sm">Edit profile</a>
      <div class="border-t border-ink-100 my-1"></div>
      <button onclick="closeUserMenu();window.doSignOut()" class="block w-full text-left px-4 py-2.5 hover:bg-ink-50 text-sm text-scarlet-500">Sign out</button>
    `;
  } else {
    menu.innerHTML = `
      <button onclick="closeUserMenu();window.openAuth()" class="block w-full text-left px-4 py-3 hover:bg-ink-50 text-sm font-semibold">Sign in / Sign up</button>
    `;
  }
}

function openUserMenu() {
  buildUserMenu();
  document.getElementById('userMenu')?.classList.remove('hidden');
}
function closeUserMenu() {
  document.getElementById('userMenu')?.classList.add('hidden');
}
window.closeUserMenu = closeUserMenu;

// ── Sell shortcut ────────────────────────────────────────────
window.openSell = () => {
  if (!state.user) { window.openAuth(); return; }
  navigate('#sell');
};

// ── Search ───────────────────────────────────────────────────
let _searchTimeout;
['searchBar', 'searchBarMobile'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', () => {
    clearTimeout(_searchTimeout);
    _searchTimeout = setTimeout(() => {
      const route = location.hash.slice(1).split('/')[0];
      if (route === 'products' || route === 'services') {
        window._triggerSearch?.();
      } else if (document.getElementById(id)?.value.trim()) {
        navigate('#products');
      }
    }, 250);
  });
});

// ── Header button wiring ──────────────────────────────────────
document.getElementById('btnAvatar')?.addEventListener('click', e => {
  e.stopPropagation();
  const menu = document.getElementById('userMenu');
  if (menu?.classList.contains('hidden')) openUserMenu();
  else closeUserMenu();
});

document.getElementById('btnMessages')?.addEventListener('click', () => {
  if (!state.user) { window.openAuth(); return; }
  navigate('#messages');
});

document.getElementById('btnSellDesktop')?.addEventListener('click', () => window.openSell());
document.getElementById('btnSellMobile')?.addEventListener('click',   () => window.openSell());

// Close menu when clicking outside
document.addEventListener('click', e => {
  if (!e.target.closest('#btnAvatar') && !e.target.closest('#userMenu')) closeUserMenu();
});

// ── Auth observer ─────────────────────────────────────────────
initAuthObserver(
  // signed in
  async (user) => {
    refreshAvatar();
    watchUnread();
    handleRoute();
  },
  // signed out
  () => {
    refreshAvatar();
    handleRoute();
  }
);

// ── Init router ───────────────────────────────────────────────
if (!location.hash || location.hash === '#') location.hash = '#home';
// handleRoute is called by initAuthObserver after auth state resolves
