import {
  ref, get, set, push, update, remove, onValue
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

import { rtdb, uploadImage } from './config.js';
import { state } from './state.js';
import { $, $$, escapeHtml, toast, setHtml, skeletonGrid, listingCard, avatarHtml, timeAgo, showModal, closeModal } from './helpers.js';

// Module-level favorites set
let userFavorites = new Set();

export async function loadFavorites() {
  if (!state.user) { userFavorites = new Set(); return; }
  const snap = await get(ref(rtdb, `favorites/${state.user.uid}`));
  userFavorites = snap.exists() ? new Set(Object.keys(snap.val())) : new Set();
}

window.toggleFavorite = async (listingId) => {
  if (!state.user) { window.openAuth(); return; }
  const isFav = userFavorites.has(listingId);
  const favRef = ref(rtdb, `favorites/${state.user.uid}/${listingId}`);
  if (isFav) {
    await remove(favRef);
    userFavorites.delete(listingId);
    toast('Removed from saved');
  } else {
    await set(favRef, true);
    userFavorites.add(listingId);
    toast('Saved!', 'success');
  }
  // Update heart UI without re-rendering
  const btn = document.getElementById(`fav-${listingId}`);
  if (btn) {
    const svg = btn.querySelector('svg');
    if (svg) {
      svg.className = `w-4 h-4 ${userFavorites.has(listingId) ? 'fill-scarlet-500 text-scarlet-500' : 'fill-none text-ink-400'}`;
    }
  }
};

// ── Helper: fetch all listings from RTDB and filter ─────────
async function fetchListings(filters = {}) {
  const snap = await get(ref(rtdb, 'listings'));
  if (!snap.exists()) return [];
  const all = [];
  snap.forEach(child => all.push({ id: child.key, ...child.val() }));
  let result = all;
  if (filters.type)     result = result.filter(l => l.type === filters.type);
  if (filters.status)   result = result.filter(l => l.status === filters.status);
  if (filters.sellerId) result = result.filter(l => l.sellerId === filters.sellerId);
  result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  if (filters.limit)    result = result.slice(0, filters.limit);
  return result;
}

// ── Home ─────────────────────────────────────────────────────
export async function renderHome() {
  const app = document.getElementById('app');
  setHtml(app, `
    <section class="bg-gradient-to-br from-scarlet-500 via-scarlet-600 to-scarlet-700 text-white">
      <div class="max-w-4xl mx-auto px-6 py-16 sm:py-24 text-center">
        <h1 class="text-4xl sm:text-5xl md:text-6xl font-black mb-4 leading-[1.05]">List it. Get found.<br class="hidden sm:inline"> Get paid.</h1>
        <p class="text-lg sm:text-xl text-scarlet-100 mb-8 max-w-2xl mx-auto leading-relaxed">
          From homemade cookies to hairstyling to tutoring — list anything you sell or any service you offer, and let people find you.
        </p>
        <div class="flex flex-wrap gap-3 justify-center">
          <a href="#products" class="bg-white text-scarlet-600 font-bold px-7 py-3 rounded-full hover:bg-scarlet-50 transition">Browse listings</a>
          <button onclick="window.openSell()" class="border-2 border-white text-white font-bold px-7 py-3 rounded-full hover:bg-white hover:text-scarlet-600 transition">Sell something</button>
        </div>
      </div>
    </section>

    <section class="px-4 py-10">
      ${state.user && !state.profile?.phone && !state.profile?.photoURL ? `
        <div class="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-4 mb-6 flex items-start gap-3">
          <div class="text-2xl shrink-0">👋</div>
          <div class="flex-1">
            <p class="font-bold text-amber-900">Welcome to Xenia!</p>
            <p class="text-sm text-amber-800 mt-0.5">Add your photo and phone number so buyers can trust you, then list something you offer.</p>
            <div class="flex gap-2 mt-3">
              <a href="#profile" class="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-full transition">Complete profile</a>
              <button onclick="window.openSell()" class="bg-white border border-amber-300 text-amber-900 text-sm font-semibold px-4 py-2 rounded-full transition">Post a listing</button>
            </div>
          </div>
          <button onclick="this.parentElement.remove()" class="text-amber-400 hover:text-amber-600 shrink-0">✕</button>
        </div>
      ` : ''}
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-2xl font-bold">Latest listings</h2>
        <a href="#products" class="text-sm font-semibold text-scarlet-500">See all →</a>
      </div>
      <div id="homeGrid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">${skeletonGrid(8)}</div>
    </section>

    <section class="px-4 py-12 bg-ink-50">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-2xl sm:text-3xl font-bold mb-2 text-center">How Xenia keeps it safe</h2>
        <p class="text-ink-500 text-center mb-8 max-w-xl mx-auto">A simple platform with real people, real reputations, and meetups on your terms.</p>
        <div class="grid sm:grid-cols-3 gap-4">
          ${trustCard('1', 'Real profiles only', 'Sellers verify their identity before listing. No anonymous accounts on the platform.')}
          ${trustCard('2', 'Built-in reputation', 'Buyers and sellers rate each other after every transaction. Reputation builds over time.')}
          ${trustCard('3', 'Safe by design', 'Meet in public, inspect before you pay. Xenia never holds your money — keeping it simple.')}
        </div>
      </div>
    </section>
  `);

  try {
    await loadFavorites();
    const listings = await fetchListings({ status: 'active', limit: 8 });
    const grid = document.getElementById('homeGrid');
    if (!grid) return;
    grid.innerHTML = listings.length
      ? listings.map(l => listingCard(l, userFavorites.has(l.id))).join('')
      : `<div class="col-span-full text-center py-12 text-ink-500">
           <p class="mb-3">No listings yet — be the first!</p>
           <button onclick="window.openSell()" class="bg-scarlet-500 text-white px-6 py-2.5 rounded-full font-semibold">Post a listing</button>
         </div>`;
  } catch (e) { console.error(e); }
}

function trustCard(num, title, desc) {
  return `<div class="bg-white rounded-2xl p-6 border border-ink-200">
    <div class="w-10 h-10 rounded-full bg-scarlet-100 text-scarlet-600 flex items-center justify-center font-black text-lg mb-3">${num}</div>
    <h3 class="font-bold mb-1">${title}</h3>
    <p class="text-sm text-ink-600 leading-relaxed">${desc}</p>
  </div>`;
}

// ── Browse ───────────────────────────────────────────────────
let _cached = [];

export async function renderListings(type) {
  const label   = type === 'good' ? 'Products' : 'Services';
  const tagline = type === 'good' ? 'Whatever you offer, someone needs it.' : 'Your skills deserve customers.';
  const app     = document.getElementById('app');

  setHtml(app, `
    <div class="px-4 py-6">
      <div class="flex items-start justify-between mb-5 gap-4">
        <div>
          <h1 class="text-3xl font-bold">${label}</h1>
          <p class="text-ink-500 mt-1">${tagline}</p>
        </div>
        <select id="sortSelect" class="bg-ink-100 rounded-full px-4 py-2 text-sm font-medium border-0 outline-none shrink-0">
          <option value="newest">Newest</option>
          <option value="price-low">Price: low</option>
          <option value="price-high">Price: high</option>
        </select>
      </div>
      <div id="browseGrid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">${skeletonGrid(12)}</div>
    </div>
  `);

  try {
    _cached = await fetchListings({ type, status: 'active' });
    await loadFavorites();
    _renderGrid();
  } catch (e) { console.error(e); toast('Failed to load', 'error'); }

  document.getElementById('sortSelect')?.addEventListener('change', _renderGrid);
  window._triggerSearch = _renderGrid;
}

function _renderGrid() {
  const grid = document.getElementById('browseGrid');
  if (!grid) return;
  const search = (document.getElementById('searchBar')?.value || document.getElementById('searchBarMobile')?.value || '').toLowerCase().trim();

  let list = _cached.filter(l =>
    !search ||
    l.title?.toLowerCase().includes(search) ||
    l.cat1?.toLowerCase().includes(search)  ||
    l.cat2?.toLowerCase().includes(search)  ||
    (l.cat3 || []).some(t => t.toLowerCase().includes(search))
  );

  const sort = document.getElementById('sortSelect')?.value;
  if (sort === 'price-low')  list.sort((a, b) => a.price - b.price);
  if (sort === 'price-high') list.sort((a, b) => b.price - a.price);

  grid.innerHTML = list.length
    ? list.map(l => listingCard(l, userFavorites.has(l.id))).join('')
    : `<div class="col-span-full text-center py-16 text-ink-500">No listings match your search.</div>`;
}

// ── Detail ───────────────────────────────────────────────────
export async function renderListing(id) {
  const app = document.getElementById('app');
  setHtml(app, `<div class="px-4 py-10 text-center"><div class="skeleton w-64 h-64 rounded-2xl mx-auto"></div></div>`);

  try {
    const snap = await get(ref(rtdb, `listings/${id}`));
    if (!snap.exists()) { _notFound(); return; }
    const l = { id, ...snap.val() };

    const sellerSnap = await get(ref(rtdb, `users/${l.sellerId}`));
    const seller     = sellerSnap.exists() ? sellerSnap.val() : { displayName: l.sellerName };
    const isOwn      = state.user?.uid === l.sellerId;

    setHtml(app, `
      <div class="max-w-5xl mx-auto px-4 py-6">
        <a href="#${l.type === 'good' ? 'products' : 'services'}" class="inline-flex items-center text-sm text-ink-500 hover:text-scarlet-500 mb-5">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          Back
        </a>
        <div class="grid md:grid-cols-2 gap-6 lg:gap-10">
          <div>
            <div id="mainPhoto" class="aspect-square bg-ink-100 rounded-2xl overflow-hidden">
              ${l.photos?.[0] ? `<img src="${escapeHtml(l.photos[0])}" class="w-full h-full object-cover" id="mainPhotoImg">` : `<div class="w-full h-full flex items-center justify-center text-ink-300"><svg class="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>`}
            </div>
            ${l.photos?.length > 1 ? `<div class="grid grid-cols-5 gap-2 mt-2">${l.photos.map(p => `<button onclick="document.getElementById('mainPhotoImg').src='${escapeHtml(p)}'" class="aspect-square rounded-lg overflow-hidden bg-ink-100 hover:ring-2 hover:ring-scarlet-500"><img src="${escapeHtml(p)}" class="w-full h-full object-cover"></button>`).join('')}</div>` : ''}
          </div>
          <div>
            <div class="flex gap-2 items-center text-xs mb-2">
              ${l.type === 'service' ? `<span class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">Service</span>` : `<span class="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Product</span>`}
              <span class="text-ink-400">${escapeHtml(l.cat1 ?? '')}</span>
              ${l.cat2 ? `<span class="text-ink-400">›</span><span class="text-ink-400">${escapeHtml(l.cat2)}</span>` : ''}
            </div>
            <h1 class="text-3xl font-bold mb-2">${escapeHtml(l.title)}</h1>
            <p class="text-3xl font-black text-scarlet-500 mb-1">$${l.price}${l.type === 'service' ? '<span class="text-base font-normal text-ink-500">/hr</span>' : ''}</p>
            <div class="flex items-center gap-3 text-xs text-ink-400 mb-4">
              <span>${timeAgo(l.createdAt)}</span>
              ${l.location ? `<span class="flex items-center gap-0.5"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>${escapeHtml(l.location)}</span>` : ''}
            </div>

            ${l.cat3?.length ? `<div class="flex flex-wrap gap-1.5 mb-5">${l.cat3.map(t => `<span class="bg-ink-100 text-ink-700 px-2.5 py-1 rounded-full text-xs font-medium">${escapeHtml(t)}</span>`).join('')}</div>` : ''}

            <div class="border-y border-ink-200 py-4 mb-5">
              <h2 class="font-semibold mb-2">Description</h2>
              <p class="text-ink-700 whitespace-pre-line leading-relaxed">${escapeHtml(l.description ?? '')}</p>
            </div>

            <a href="#user/${l.sellerId}" class="flex items-center gap-3 p-3 -mx-3 rounded-2xl hover:bg-ink-50 mb-5 transition">
              ${avatarHtml(seller, 'md')}
              <div class="flex-1 min-w-0">
                <p class="font-semibold">${escapeHtml(seller.displayName ?? 'Anonymous')}</p>
                <p class="text-xs text-ink-500">${seller.rating ? `★ ${seller.rating.toFixed(1)} · ${seller.reviewCount} reviews` : 'New seller'}${seller.schoolVerified ? ' · Verified' : ''}</p>
              </div>
              <svg class="w-4 h-4 text-ink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </a>

            ${isOwn ? `
              <div class="grid grid-cols-2 gap-2">
                <a href="#edit-listing/${l.id}" class="text-center bg-ink-100 hover:bg-ink-200 font-semibold py-3 rounded-full transition">Edit</a>
                <button onclick="window.markSold('${l.id}')" class="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-full transition">Mark sold</button>
              </div>
              <button onclick="window.deleteListing('${l.id}')" class="w-full text-scarlet-500 hover:bg-scarlet-50 font-medium py-2.5 rounded-full text-sm mt-2 transition">Delete listing</button>
            ` : `
              <div class="flex gap-2 mb-2">
                <button onclick="window.messageSeller('${l.id}','${l.sellerId}')" class="flex-1 bg-scarlet-500 hover:bg-scarlet-600 text-white font-bold py-3.5 rounded-full transition">Message seller</button>
                <button onclick="window.shareListing('${l.id}','${escapeHtml(l.title)}')" class="px-5 bg-ink-100 hover:bg-ink-200 font-medium py-3.5 rounded-full transition" title="Share">
                  <svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                </button>
              </div>
              <button onclick="window.reportListing('${l.id}','${l.sellerId}')" class="w-full text-ink-400 hover:bg-ink-50 text-sm py-2 rounded-full transition">Report this listing</button>
            `}
          </div>
        </div>
      </div>
    `);
  } catch (e) { console.error(e); _notFound(); }
}

// ── My Listings ──────────────────────────────────────────────
export async function renderMyListings() {
  const app = document.getElementById('app');
  setHtml(app, `<div class="px-4 py-6"><div class="flex justify-between items-center mb-5"><h1 class="text-3xl font-bold">My listings</h1><button onclick="window.openSell()" class="bg-scarlet-500 hover:bg-scarlet-600 text-white text-sm font-semibold px-4 py-2 rounded-full">+ New</button></div><div id="myGrid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">${skeletonGrid(8)}</div></div>`);
  try {
    const list = await fetchListings({ sellerId: state.user.uid });
    const grid = document.getElementById('myGrid');
    if (!grid) return;
    grid.innerHTML = list.length
      ? list.map(listingCard).join('')
      : `<div class="col-span-full text-center py-16"><p class="text-ink-500 mb-4">No listings yet.</p><button onclick="window.openSell()" class="bg-scarlet-500 text-white px-6 py-3 rounded-full font-semibold">Post your first listing</button></div>`;
  } catch (e) { console.error(e); toast('Failed to load', 'error'); }
}

// ── Sell / Edit ──────────────────────────────────────────────
export async function renderSell(editId = null) {
  if (!state.user) { window.openAuth(); return; }

  // Require photo + phone before listing
  if (!editId && (!state.profile.photoURL || !state.profile.phone)) {
    toast('Complete your profile first — photo and phone required to list', 'error');
    setTimeout(() => window.navigate('#profile'), 300);
    return;
  }

  const editing = !!editId;
  const app = document.getElementById('app');

  setHtml(app, `
    <div class="max-w-2xl mx-auto px-4 py-6">
      <h1 class="text-3xl font-bold mb-1">${editing ? 'Edit listing' : 'Sell on Xenia'}</h1>
      <p class="text-ink-500 mb-7">${editing ? 'Update your listing.' : 'List a product or service in minutes.'}</p>
      <form id="sellForm" class="space-y-7">
        <div>
          <label class="block text-sm font-bold mb-3">What are you offering?</label>
          <div class="grid grid-cols-2 gap-3">
            <label class="cursor-pointer"><input type="radio" name="type" value="good" class="peer sr-only" ${editing ? '' : 'checked'}><div class="border-2 border-ink-200 peer-checked:border-scarlet-500 peer-checked:bg-scarlet-50 rounded-2xl p-4 text-center transition"><p class="font-bold">A good</p><p class="text-xs text-ink-500 mt-0.5">A physical item</p></div></label>
            <label class="cursor-pointer"><input type="radio" name="type" value="service" class="peer sr-only"><div class="border-2 border-ink-200 peer-checked:border-scarlet-500 peer-checked:bg-scarlet-50 rounded-2xl p-4 text-center transition"><p class="font-bold">A service</p><p class="text-xs text-ink-500 mt-0.5">Skills & expertise</p></div></label>
          </div>
        </div>
        <div>
          <label class="block text-sm font-bold mb-1">Category</label>
          <p class="text-xs text-ink-400 mb-3">Be specific — buyers search these.</p>
          <div class="space-y-2">
            <input name="cat1" required placeholder="Main category — e.g. Electronics / Tutoring" class="w-full bg-ink-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-scarlet-200 focus:bg-white outline-none">
            <input name="cat2" placeholder="Subcategory — e.g. Phone / Math" class="w-full bg-ink-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-scarlet-200 focus:bg-white outline-none">
            <input name="cat3" placeholder="Tags, comma-separated — e.g. Samsung, Galaxy S22" class="w-full bg-ink-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-scarlet-200 focus:bg-white outline-none">
          </div>
        </div>
        <div>
          <label class="block text-sm font-bold mb-2">Photos <span class="font-normal text-ink-400">(up to 5)</span></label>
          <div id="photoGrid" class="grid grid-cols-5 gap-2 mb-1">
            <label id="addPhotoLabel" class="aspect-square border-2 border-dashed border-ink-300 rounded-xl flex flex-col items-center justify-center text-ink-400 cursor-pointer hover:border-scarlet-400 hover:text-scarlet-500 transition">
              <svg class="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              <span class="text-[10px]">Add</span>
              <input type="file" accept="image/*" multiple id="photoInput" class="sr-only">
            </label>
          </div>
        </div>
        <div>
          <label class="block text-sm font-bold mb-2">Location</label>
          <input name="location" placeholder="Neighbourhood or city — e.g. Newark, NJ" class="w-full bg-ink-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-scarlet-200 focus:bg-white outline-none">
        </div>
        <div>
          <label class="block text-sm font-bold mb-2">Title</label>
          <input name="title" required maxlength="80" placeholder="e.g. Homemade chocolate chip cookies" class="w-full bg-ink-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-scarlet-200 focus:bg-white outline-none">
        </div>
        <div>
          <label class="block text-sm font-bold mb-2">Description</label>
          <textarea name="description" required rows="4" placeholder="What you're offering, any details buyers should know..." class="w-full bg-ink-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-scarlet-200 focus:bg-white outline-none resize-none"></textarea>
        </div>
        <div>
          <label class="block text-sm font-bold mb-2">Price</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500 font-bold">$</span>
            <input name="price" type="number" min="0" step="0.01" required placeholder="0" class="w-full bg-ink-100 rounded-xl pl-8 pr-20 py-3 text-xl font-bold focus:ring-2 focus:ring-scarlet-200 focus:bg-white outline-none">
            <span id="priceUnit" class="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-400"></span>
          </div>
        </div>
        <button type="submit" id="publishBtn" class="w-full bg-scarlet-500 hover:bg-scarlet-600 text-white font-bold py-4 rounded-full text-lg transition disabled:opacity-50">${editing ? 'Save changes' : 'Publish listing'}</button>
      </form>
    </div>
  `);

  let photos = [];
  const photoGrid = document.getElementById('photoGrid');
  const addLabel  = document.getElementById('addPhotoLabel');

  const refreshPhotos = () => {
    [...photoGrid.querySelectorAll('.pt')].forEach(el => el.remove());
    photos.forEach((url, i) => {
      const w = document.createElement('div');
      w.className = 'pt aspect-square relative rounded-xl overflow-hidden group';
      w.innerHTML = `<img src="${escapeHtml(url)}" class="w-full h-full object-cover">${i === 0 ? '<span class="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Cover</span>' : ''}<button type="button" class="rm absolute top-1 right-1 bg-black/60 hover:bg-scarlet-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition">×</button>`;
      w.querySelector('.rm').onclick = () => { photos.splice(i, 1); refreshPhotos(); };
      photoGrid.insertBefore(w, addLabel);
    });
    addLabel.style.display = photos.length >= 5 ? 'none' : '';
  };

  document.getElementById('photoInput').addEventListener('change', async e => {
    const files = [...e.target.files].slice(0, 5 - photos.length);
    if (!files.length) return;
    const btn = document.getElementById('publishBtn');
    btn.disabled = true; btn.textContent = `Uploading...`;
    for (const f of files) {
      try { const url = await uploadImage(f); if (url) { photos.push(url); refreshPhotos(); } }
      catch (err) { toast(err.message, 'error'); }
    }
    btn.disabled = false; btn.textContent = editing ? 'Save changes' : 'Publish listing';
    e.target.value = '';
  });

  const updateUnit = () => {
    document.getElementById('priceUnit').textContent = document.querySelector('input[name="type"]:checked')?.value === 'service' ? '/ hr' : '';
  };
  $$('input[name="type"]').forEach(r => r.addEventListener('change', updateUnit));

  if (editing) {
    try {
      const snap = await get(ref(rtdb, `listings/${editId}`));
      if (!snap.exists() || snap.val().sellerId !== state.user.uid) { toast('Not found', 'error'); window.navigate('#my-listings'); return; }
      const l = snap.val();
      document.querySelector(`input[name="type"][value="${l.type}"]`).checked = true;
      updateUnit();
      document.querySelector('input[name="cat1"]').value = l.cat1 ?? '';
      document.querySelector('input[name="cat2"]').value = l.cat2 ?? '';
      document.querySelector('input[name="cat3"]').value = (l.cat3 ?? []).join(', ');
      document.querySelector('input[name="location"]').value = l.location ?? '';
      document.querySelector('input[name="title"]').value = l.title ?? '';
      document.querySelector('textarea[name="description"]').value = l.description ?? '';
      document.querySelector('input[name="price"]').value = l.price ?? '';
      photos = [...(l.photos ?? [])];
      refreshPhotos();
    } catch (e) { console.error(e); }
  }

  document.getElementById('sellForm').addEventListener('submit', async e => {
    e.preventDefault();
    if (!photos.length) { toast('Add at least one photo', 'error'); return; }
    const btn = document.getElementById('publishBtn');
    btn.disabled = true; btn.textContent = editing ? 'Saving...' : 'Publishing...';
    const fd = new FormData(e.target);
    const data = {
      type: fd.get('type'), cat1: fd.get('cat1').trim(), cat2: (fd.get('cat2') ?? '').trim(),
      cat3: (fd.get('cat3') ?? '').split(',').map(t => t.trim()).filter(Boolean),
      location: (fd.get('location') ?? '').trim(),
      title: fd.get('title').trim(), description: fd.get('description').trim(),
      price: parseFloat(fd.get('price')), photos, status: 'active'
    };
    try {
      if (editing) {
        await update(ref(rtdb, `listings/${editId}`), data);
        toast('Updated!', 'success');
        window.navigate(`#listing/${editId}`);
      } else {
        data.sellerId = state.user.uid;
        data.sellerName = state.profile.displayName;
        data.sellerPhoto = state.profile.photoURL ?? null;
        data.createdAt = Date.now();
        const newRef = push(ref(rtdb, 'listings'));
        data.id = newRef.key;
        await set(newRef, data);
        toast('Published!', 'success');
        window.navigate(`#listing/${newRef.key}`);
      }
    } catch (err) { console.error(err); toast('Failed to save', 'error'); btn.disabled = false; btn.textContent = editing ? 'Save changes' : 'Publish listing'; }
  });
}

// ── Actions ──────────────────────────────────────────────────
window.markSold = async (id) => {
  // Find who messaged about this listing (potential buyers)
  const listingSnap = await get(ref(rtdb, `listings/${id}`));
  if (!listingSnap.exists()) return;
  const listing = listingSnap.val();

  const userConvsSnap = await get(ref(rtdb, `userConversations/${state.user.uid}`));
  const buyers = [];
  if (userConvsSnap.exists()) {
    for (const cid of Object.keys(userConvsSnap.val())) {
      const cs = await get(ref(rtdb, `conversations/${cid}`));
      if (!cs.exists()) continue;
      const conv = cs.val();
      if (conv.listingId === id) {
        const otherId = Object.keys(conv.participants || {}).find(p => p !== state.user.uid);
        if (otherId) {
          const other = conv.participantInfo?.[otherId] || {};
          buyers.push({ uid: otherId, displayName: other.displayName || 'Unknown', photoURL: other.photoURL });
        }
      }
    }
  }

  showModal(`
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-1">Mark as sold</h2>
      <p class="text-ink-500 text-sm mb-5">Rate your buyer to build trust on the platform.</p>

      ${buyers.length > 0 ? `
        <div class="mb-5">
          <label class="block text-sm font-bold mb-2">Who bought it?</label>
          <div class="space-y-2" id="buyerSelect">
            ${buyers.map((b, i) => `
              <label class="flex items-center gap-3 p-3 border-2 border-ink-200 rounded-xl cursor-pointer hover:bg-ink-50 transition has-[:checked]:border-scarlet-500 has-[:checked]:bg-scarlet-50">
                <input type="radio" name="buyer" value="${b.uid}" class="sr-only" ${i === 0 ? 'checked' : ''}>
                ${avatarHtml(b, 'sm')}
                <span class="font-medium">${escapeHtml(b.displayName)}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="mb-5">
          <label class="block text-sm font-bold mb-2">Rate the buyer</label>
          <div id="starRating" class="flex gap-1">
            ${[1,2,3,4,5].map(n => `<button type="button" data-star="${n}" class="star-btn text-3xl text-ink-300 hover:text-amber-400 transition" onclick="window._selectStar(${n})">&#9733;</button>`).join('')}
          </div>
          <input type="hidden" id="ratingValue" value="5">
        </div>

        <div class="mb-5">
          <label class="block text-sm font-bold mb-2">Comment <span class="font-normal text-ink-400">(optional)</span></label>
          <textarea id="reviewComment" rows="2" placeholder="How was the transaction?" class="w-full bg-ink-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-scarlet-200 focus:bg-white outline-none resize-none"></textarea>
        </div>
      ` : `
        <p class="text-ink-500 text-sm mb-5">No one messaged about this listing yet, so there's no buyer to rate. The listing will just be marked as sold.</p>
      `}

      <div class="flex gap-2">
        <button onclick="closeModal()" class="flex-1 bg-ink-100 hover:bg-ink-200 font-semibold py-3 rounded-full transition">Cancel</button>
        <button id="confirmSoldBtn" onclick="window._confirmSold('${id}')" class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-full transition">Confirm sold</button>
      </div>
    </div>
  `);

  // Initialize stars to 5
  window._selectStar(5);
};

window._selectStar = (n) => {
  document.querySelectorAll('.star-btn').forEach((btn, i) => {
    btn.style.color = i < n ? '#f59e0b' : '#d1d5db';
  });
  const input = document.getElementById('ratingValue');
  if (input) input.value = n;
};

window._confirmSold = async (listingId) => {
  const btn = document.getElementById('confirmSoldBtn');
  btn.disabled = true; btn.textContent = 'Saving...';

  try {
    // Mark listing as sold
    await update(ref(rtdb, `listings/${listingId}`), { status: 'sold' });
    await update(ref(rtdb, `users/${state.user.uid}`), { transactionsCompleted: (state.profile.transactionsCompleted || 0) + 1 });

    // Save review if buyer was selected
    const buyerRadio = document.querySelector('input[name="buyer"]:checked');
    if (buyerRadio) {
      const buyerId = buyerRadio.value;
      const rating  = parseInt(document.getElementById('ratingValue')?.value || '5');
      const comment = document.getElementById('reviewComment')?.value?.trim() || '';

      const reviewRef = push(ref(rtdb, 'reviews'));
      await set(reviewRef, {
        id:           reviewRef.key,
        reviewerId:   state.user.uid,
        reviewerName: state.profile.displayName,
        reviewerPhoto: state.profile.photoURL || null,
        reviewedId:   buyerId,
        listingId,
        rating,
        comment,
        createdAt:    Date.now()
      });

      // Update buyer's average rating
      const buyerSnap = await get(ref(rtdb, `users/${buyerId}`));
      if (buyerSnap.exists()) {
        const buyer = buyerSnap.val();
        const oldCount = buyer.reviewCount || 0;
        const oldRating = buyer.rating || 0;
        const newCount = oldCount + 1;
        const newRating = ((oldRating * oldCount) + rating) / newCount;
        await update(ref(rtdb, `users/${buyerId}`), { rating: Math.round(newRating * 10) / 10, reviewCount: newCount });
      }
    }

    closeModal();
    toast('Marked as sold! Review saved.', 'success');
    window.navigate('#my-listings');
  } catch (e) {
    console.error(e);
    toast('Failed to save', 'error');
    btn.disabled = false; btn.textContent = 'Confirm sold';
  }
};

window.deleteListing = async (id) => {
  if (!confirm('Delete? This cannot be undone.')) return;
  await remove(ref(rtdb, `listings/${id}`));
  toast('Deleted');
  window.navigate('#my-listings');
};

window.shareListing = async (id, title) => {
  const url = `${location.origin}/#listing/${id}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: `${title} — Xenia`, url });
    } catch(e) { /* user cancelled share */ }
  } else {
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied!', 'success');
    } catch(e) {
      prompt('Copy this link:', url);
    }
  }
};

window.reportListing = async (lid, sid) => {
  if (!state.user) { window.openAuth(); return; }
  const reason = prompt('Why are you reporting this?');
  if (!reason) return;
  const r = push(ref(rtdb, 'reports'));
  await set(r, { type: 'listing', reporterId: state.user.uid, reportedId: sid, listingId: lid, reason, createdAt: Date.now() });
  toast('Report submitted.', 'success');
};

function _notFound() {
  document.getElementById('app').innerHTML = `<div class="px-4 py-24 text-center"><h1 class="text-4xl font-black mb-3">404</h1><p class="text-ink-500 mb-6">Not found.</p><a href="#home" class="bg-scarlet-500 text-white px-7 py-3 rounded-full font-bold">Go home</a></div>`;
}

export async function renderSaved() {
  const app = document.getElementById('app');
  if (!state.user) { window.openAuth(); return; }
  setHtml(app, `<div class="px-4 py-6"><h1 class="text-3xl font-bold mb-5">Saved listings</h1><div id="savedGrid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">${skeletonGrid(8)}</div></div>`);
  try {
    const snap = await get(ref(rtdb, `favorites/${state.user.uid}`));
    if (!snap.exists()) {
      document.getElementById('savedGrid').innerHTML = `<div class="col-span-full text-center py-16 text-ink-500"><p>No saved listings yet.</p><p class="text-sm mt-2">Tap the heart on any listing to save it.</p></div>`;
      return;
    }
    const ids = Object.keys(snap.val());
    const listings = [];
    for (const id of ids) {
      const ls = await get(ref(rtdb, `listings/${id}`));
      if (ls.exists() && ls.val().status === 'active') listings.push({ id, ...ls.val() });
    }
    const grid = document.getElementById('savedGrid');
    grid.innerHTML = listings.length
      ? listings.map(l => listingCard(l, true)).join('')
      : `<div class="col-span-full text-center py-16 text-ink-500">Your saved listings are gone — they may have been sold.</div>`;
  } catch(e) { console.error(e); toast('Failed to load', 'error'); }
}
