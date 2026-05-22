// ── Entry point — loaded as ES module from index.html ────────
import { ref, get, update, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { state } from './state.js';
import { avatarHtml, toast, $, escapeHtml, timeAgo } from './helpers.js';
import { initAuthObserver, openAuth, watchUnread } from './auth.js';
import { handleRoute, navigate } from './router.js';
import { rtdb } from './config.js';

// ── Notifications ────────────────────────────────────────────
let _notifications = [];

function renderNotifMenu() {
  const menu = document.getElementById('notifMenu');
  if (!menu) return;

  if (!state.user) {
    menu.innerHTML = `<div class="p-6 text-center text-sm text-ink-500">Sign in to see notifications</div>`;
    return;
  }

  if (!_notifications.length) {
    menu.innerHTML = `
      <div class="p-4 border-b border-ink-100">
        <h3 class="font-bold">Notifications</h3>
      </div>
      <div class="p-8 text-center text-sm text-ink-500">No notifications yet.</div>`;
    return;
  }

  const unreadCount = _notifications.filter(n => !n.read).length;

  menu.innerHTML = `
    <div class="p-4 border-b border-ink-100 flex justify-between items-center">
      <h3 class="font-bold">Notifications</h3>
      ${unreadCount > 0 ? `<button onclick="window.markAllNotifsRead()" class="text-xs text-scarlet-500 hover:text-scarlet-600 font-medium">Mark all read</button>` : ''}
    </div>
    <div class="overflow-y-auto" style="max-height:400px">
      ${_notifications.slice(0, 20).map(n => `
        <button onclick="window.openNotif('${n.id}','${escapeHtml(n.link || '#home')}')"
          class="w-full text-left p-3 hover:bg-ink-50 border-b border-ink-100 last:border-0 transition flex gap-3 items-start ${!n.read ? 'bg-scarlet-50/40' : ''}">
          ${avatarHtml({ photoURL: n.fromUserPhoto, displayName: n.fromUserName, uid: n.fromUserId }, 'sm')}
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm line-clamp-2">${escapeHtml(n.title)}</p>
            ${n.body ? `<p class="text-xs text-ink-500 line-clamp-1 mt-0.5">${escapeHtml(n.body)}</p>` : ''}
            <p class="text-xs text-ink-400 mt-0.5">${timeAgo(n.createdAt)}</p>
          </div>
          ${!n.read ? '<div class="w-2 h-2 rounded-full bg-scarlet-500 shrink-0 mt-2"></div>' : ''}
        </button>
      `).join('')}
    </div>`;
}

function updateNotifBadge() {
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  const unread = _notifications.filter(n => !n.read).length;
  if (unread > 0) {
    badge.textContent = unread > 9 ? '9+' : unread;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function watchNotifications() {
  if (!state.user) return;
  const notifRef = ref(rtdb, `notifications/${state.user.uid}`);
  const unsub = onValue(notifRef, snap => {
    _notifications = [];
    if (snap.exists()) {
      snap.forEach(child => _notifications.push({ id: child.key, ...child.val() }));
    }
    _notifications.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    updateNotifBadge();
    // Re-render menu if it's open
    if (!document.getElementById('notifMenu')?.classList.contains('hidden')) {
      renderNotifMenu();
    }
  });
  state.unsubscribes.push(unsub);
}

window.openNotif = async (notifId, link) => {
  // Mark this notification as read
  try { await update(ref(rtdb, `notifications/${state.user.uid}/${notifId}`), { read: true }); } catch(e) {}
  closeNotifMenu();
  navigate(link);
};

window.markAllNotifsRead = async () => {
  try {
    const updates = {};
    _notifications.forEach(n => { if (!n.read) updates[`${n.id}/read`] = true; });
    if (Object.keys(updates).length) await update(ref(rtdb, `notifications/${state.user.uid}`), updates);
  } catch(e) { console.error(e); }
};

function openNotifMenu() {
  renderNotifMenu();
  document.getElementById('notifMenu')?.classList.remove('hidden');
}
function closeNotifMenu() {
  document.getElementById('notifMenu')?.classList.add('hidden');
}

// ── Avatar refresh (called after profile save) ────────────────
function refreshAvatar() {
  const wrap = document.getElementById('navAvatarWrap');
  if (!wrap) return;
  if (state.user && state.profile) {
    wrap.outerHTML = `<div id="navAvatarWrap">${avatarHtml(state.profile, 'sm')}</div>`;
  } else {
    wrap.outerHTML = `<div id="navAvatarWrap" class="w-8 h-8 rounded-full bg-ink-200 flex items-center justify-center text-ink-500"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg></div>`;
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
      <a href="#saved" onclick="closeUserMenu()" class="block px-4 py-2.5 hover:bg-ink-50 text-sm">Saved listings</a>
      <a href="#messages"    onclick="closeUserMenu()" class="block px-4 py-2.5 hover:bg-ink-50 text-sm">Messages</a>
      <a href="#profile"     onclick="closeUserMenu()" class="block px-4 py-2.5 hover:bg-ink-50 text-sm">Edit profile</a>
      <div class="border-t border-ink-100 my-1"></div>
      <button onclick="closeUserMenu();window.doSignOut()" class="block w-full text-left px-4 py-2.5 hover:bg-ink-50 text-sm text-scarlet-500">Sign out</button>
    `;
  } else {
    menu.innerHTML = `
      <button onclick="closeUserMenu();window.openAuth('signin')" class="block w-full text-left px-4 py-3 hover:bg-ink-50 text-sm font-semibold">Sign in</button>
      <div class="border-t border-ink-100"></div>
      <button onclick="closeUserMenu();window.openAuth('signup')" class="block w-full text-left px-4 py-3 hover:bg-ink-50 text-sm font-semibold text-scarlet-500">Create account</button>
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

document.getElementById('btnNotif')?.addEventListener('click', e => {
  e.stopPropagation();
  if (!state.user) { window.openAuth(); return; }
  const menu = document.getElementById('notifMenu');
  if (menu?.classList.contains('hidden')) {
    closeUserMenu();
    openNotifMenu();
  } else closeNotifMenu();
});

document.getElementById('btnSellDesktop')?.addEventListener('click', () => window.openSell());
document.getElementById('btnSellMobile')?.addEventListener('click',   () => window.openSell());

// Close menus when clicking outside
document.addEventListener('click', e => {
  if (!e.target.closest('#btnAvatar') && !e.target.closest('#userMenu')) closeUserMenu();
  if (!e.target.closest('#btnNotif')  && !e.target.closest('#notifMenu')) closeNotifMenu();
});

// ── Auth observer ─────────────────────────────────────────────
initAuthObserver(
  // signed in
  async (user) => {
    refreshAvatar();
    watchUnread();
    watchNotifications();
    handleRoute();
  },
  // signed out
  () => {
    refreshAvatar();
    const route = location.hash.slice(1).split('/')[0];
    const authRoutes = ['my-listings', 'messages', 'profile', 'sell', 'edit-listing', 'user'];
    if (authRoutes.includes(route)) {
      navigate('#home');
    } else {
      handleRoute();
    }
  }
);

// ── Init router ───────────────────────────────────────────────
if (!location.hash || location.hash === '#') location.hash = '#home';
// handleRoute is called by initAuthObserver after auth state resolves
