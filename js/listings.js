import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc,
  deleteDoc, query, where, orderBy, limit, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db, uploadImage } from './config.js';
import { state } from './state.js';
import { $, $$, escapeHtml, toast, setHtml, skeletonGrid, listingCard, avatarHtml, timeAgo } from './helpers.js';

// ── Home ─────────────────────────────────────────────────────
export async function renderHome() {
  const app = document.getElementById('app');
  setHtml(app, `
    <!-- Hero -->
    <section class="bg-gradient-to-br from-scarlet-500 via-scarlet-600 to-scarlet-700 text-white">
      <div class="max-w-4xl mx-auto px-6 py-16 sm:py-24 text-center">
        <h1 class="text-4xl sm:text-5xl md:text-6xl font-black mb-4 leading-tight">The student marketplace</h1>
        <p class="text-lg sm:text-xl text-scarlet-100 mb-8 max-w-2xl mx-auto">
          Buy, sell, and book services with verified students on your campus.
        </p>
        <div class="flex flex-wrap gap-3 justify-center">
          <a href="#products" class="bg-white text-scarlet-600 font-bold px-7 py-3 rounded-full hover:bg-scarlet-50 transition">Browse listings</a>
          <button onclick="window.openSell()" class="border-2 border-white text-white font-bold px-7 py-3 rounded-full hover:bg-white hover:text-scarlet-600 transition">Sell something</button>
        </div>
      </div>
    </section>

    <!-- Recent listings -->
    <section class="px-4 py-10">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-2xl font-bold">Latest listings</h2>
        <a href="#products" class="text-sm font-semibold text-scarlet-500">See all →</a>
      </div>
      <div id="homeGrid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">${skeletonGrid(8)}</div>
    </section>

    <!-- Trust section -->
    <section class="px-4 py-10 bg-ink-50">
      <h2 class="text-2xl font-bold mb-6 text-center">Why Xenia is safe</h2>
      <div class="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
        ${trustCard('🎓', 'Verified students', 'Sellers verify with a school email so you know you\'re dealing with real classmates.')}
        ${trustCard('⭐', 'Ratings & reviews', 'Every completed transaction can be reviewed. See a seller\'s reputation first.')}
        ${trustCard('📍', 'Campus meetups', 'We always suggest public campus spots — library, dining hall, student center.')}
      </div>
    </section>
  `);

  // Load recent listings
  try {
    const q    = query(collection(db, 'listings'), where('status','==','active'), orderBy('createdAt','desc'), limit(8));
    const snap = await getDocs(q);
    const listings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const grid = document.getElementById('homeGrid');
    if (!grid) return;
    grid.innerHTML = listings.length
      ? listings.map(listingCard).join('')
      : `<div class="col-span-full text-center py-12 text-ink-500">
           <p class="mb-3">No listings yet — be the first!</p>
           <button onclick="window.openSell()" class="bg-scarlet-500 text-white px-6 py-2.5 rounded-full font-semibold">Post a listing</button>
         </div>`;
  } catch (e) {
    console.error(e);
  }
}

function trustCard(emoji, title, desc) {
  return `<div class="bg-white rounded-2xl p-5 border border-ink-200">
    <div class="text-3xl mb-2">${emoji}</div>
    <h3 class="font-bold mb-1">${title}</h3>
    <p class="text-sm text-ink-600">${desc}</p>
  </div>`;
}

// ── Browse (products / services) ─────────────────────────────
let _currentListings = [];

export async function renderListings(type) {
  const label = type === 'good' ? 'Products' : 'Services';
  const app   = document.getElementById('app');

  setHtml(app, `
    <div class="px-4 py-6">
      <div class="flex items-center justify-between mb-5">
        <h1 class="text-3xl font-bold">${label}</h1>
        <select id="sortSelect" class="bg-ink-100 rounded-full px-4 py-2 text-sm font-medium border-0 outline-none">
          <option value="newest">Newest</option>
          <option value="price-low">Price: low to high</option>
          <option value="price-high">Price: high to low</option>
        </select>
      </div>
      <div id="browseGrid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">${skeletonGrid(12)}</div>
    </div>
  `);

  try {
    const q    = query(collection(db, 'listings'), where('type','==',type), where('status','==','active'), orderBy('createdAt','desc'), limit(60));
    const snap = await getDocs(q);
    _currentListings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    _renderBrowseGrid();
  } catch (e) {
    console.error(e);
    toast('Failed to load listings', 'error');
  }

  document.getElementById('sortSelect')?.addEventListener('change', _renderBrowseGrid);
  window._triggerSearch = _renderBrowseGrid;
}

function _renderBrowseGrid() {
  const grid = document.getElementById('browseGrid');
  if (!grid) return;

  const search = (
    document.getElementById('searchBar')?.value ||
    document.getElementById('searchBarMobile')?.value || ''
  ).toLowerCase().trim();

  let list = _currentListings.filter(l =>
    !search ||
    l.title?.toLowerCase().includes(search) ||
    l.cat1?.toLowerCase().includes(search)  ||
    l.cat2?.toLowerCase().includes(search)  ||
    (l.cat3 || []).some(t => t.toLowerCase().includes(search))
  );

  const sort = document.getElementById('sortSelect')?.value;
  if (sort === 'price-low')  list.sort((a,b) => a.price - b.price);
  if (sort === 'price-high') list.sort((a,b) => b.price - a.price);

  grid.innerHTML = list.length
    ? list.map(listingCard).join('')
    : `<div class="col-span-full text-center py-16 text-ink-500">No listings match your search.</div>`;
}

// ── Listing detail ───────────────────────────────────────────
export async function renderListing(id) {
  const app = document.getElementById('app');
  setHtml(app, `<div class="px-4 py-10 text-center"><div class="skeleton w-64 h-64 rounded-2xl mx-auto"></div></div>`);

  try {
    const snap = await getDoc(doc(db, 'listings', id));
    if (!snap.exists()) { renderNotFound(); return; }
    const l = { id: snap.id, ...snap.data() };

    const sellerSnap = await getDoc(doc(db, 'users', l.sellerId));
    const seller     = sellerSnap.exists() ? sellerSnap.data() : { displayName: l.sellerName };
    const isOwn      = state.user?.uid === l.sellerId;

    setHtml(app, `
      <div class="max-w-5xl mx-auto px-4 py-6">
        <a href="#${l.type === 'good' ? 'products' : 'services'}"
          class="inline-flex items-center text-sm text-ink-500 hover:text-scarlet-500 mb-5">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          Back to ${l.type === 'good' ? 'Products' : 'Services'}
        </a>

        <div class="grid md:grid-cols-2 gap-6 lg:gap-10">
          <!-- Photos -->
          <div>
            <div id="mainPhoto" class="aspect-square bg-ink-100 rounded-2xl overflow-hidden">
              ${l.photos?.[0]
                ? `<img src="${escapeHtml(l.photos[0])}" class="w-full h-full object-cover" id="mainPhotoImg">`
                : `<div class="w-full h-full flex items-center justify-center text-ink-300">
                     <svg class="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                     </svg>
                   </div>`}
            </div>
            ${l.photos?.length > 1 ? `
              <div class="grid grid-cols-5 gap-2 mt-2">
                ${l.photos.map(p => `
                  <button onclick="document.getElementById('mainPhotoImg').src='${escapeHtml(p)}'"
                    class="aspect-square rounded-lg overflow-hidden bg-ink-100 hover:ring-2 hover:ring-scarlet-500 transition">
                    <img src="${escapeHtml(p)}" class="w-full h-full object-cover">
                  </button>`).join('')}
              </div>` : ''}
          </div>

          <!-- Details -->
          <div>
            <div class="flex gap-2 items-center text-xs mb-2">
              ${l.type === 'service'
                ? `<span class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">Service</span>`
                : `<span class="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Product</span>`}
              <span class="text-ink-400">${escapeHtml(l.cat1 ?? '')}</span>
              ${l.cat2 ? `<span class="text-ink-400">›</span><span class="text-ink-400">${escapeHtml(l.cat2)}</span>` : ''}
            </div>

            <h1 class="text-3xl font-bold mb-2">${escapeHtml(l.title)}</h1>
            <p class="text-3xl font-black text-scarlet-500 mb-1">
              $${l.price}${l.type === 'service' ? '<span class="text-base font-normal text-ink-500">/hr</span>' : ''}
            </p>
            <p class="text-xs text-ink-400 mb-4">${timeAgo(l.createdAt)}</p>

            ${l.cat3?.length ? `
              <div class="flex flex-wrap gap-1.5 mb-5">
                ${l.cat3.map(t => `<span class="bg-ink-100 text-ink-700 px-2.5 py-1 rounded-full text-xs font-medium">${escapeHtml(t)}</span>`).join('')}
              </div>` : ''}

            <div class="border-y border-ink-200 py-4 mb-5">
              <h2 class="font-semibold mb-2">Description</h2>
              <p class="text-ink-700 whitespace-pre-line leading-relaxed">${escapeHtml(l.description ?? '')}</p>
            </div>

            <!-- Seller card -->
            <a href="#user/${l.sellerId}" class="flex items-center gap-3 p-3 -mx-3 rounded-2xl hover:bg-ink-50 mb-5 transition">
              ${avatarHtml(seller, 'md')}
              <div class="flex-1 min-w-0">
                <p class="font-semibold">${escapeHtml(seller.displayName ?? 'Anonymous')}</p>
                <p class="text-xs text-ink-500">
                  ${seller.rating ? `★ ${seller.rating.toFixed(1)} · ${seller.reviewCount} reviews` : 'New seller'}
                  ${seller.schoolVerified ? ' · Verified student' : ''}
                </p>
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
              <button onclick="window.messageSeller('${l.id}','${l.sellerId}')"
                class="w-full bg-scarlet-500 hover:bg-scarlet-600 text-white font-bold py-3.5 rounded-full mb-2 transition">
                Message seller
              </button>
              <button onclick="window.reportListing('${l.id}','${l.sellerId}')"
                class="w-full text-ink-400 hover:bg-ink-50 text-sm py-2 rounded-full transition">
                Report this listing
              </button>
            `}
          </div>
        </div>
      </div>
    `);
  } catch (e) {
    console.error(e);
    renderNotFound();
  }
}

// ── My listings ──────────────────────────────────────────────
export async function renderMyListings() {
  const app = document.getElementById('app');
  setHtml(app, `
    <div class="px-4 py-6">
      <div class="flex justify-between items-center mb-5">
        <h1 class="text-3xl font-bold">My listings</h1>
        <button onclick="window.openSell()" class="bg-scarlet-500 hover:bg-scarlet-600 text-white text-sm font-semibold px-4 py-2 rounded-full">+ New</button>
      </div>
      <div id="myGrid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">${skeletonGrid(8)}</div>
    </div>
  `);
  try {
    const q    = query(collection(db, 'listings'), where('sellerId','==',state.user.uid), orderBy('createdAt','desc'));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const grid = document.getElementById('myGrid');
    if (!grid) return;
    grid.innerHTML = list.length
      ? list.map(listingCard).join('')
      : `<div class="col-span-full text-center py-16">
           <p class="text-ink-500 mb-4">No listings yet.</p>
           <button onclick="window.openSell()" class="bg-scarlet-500 text-white px-6 py-3 rounded-full font-semibold">Post your first listing</button>
         </div>`;
  } catch (e) {
    console.error(e);
    toast('Failed to load listings', 'error');
  }
}

// ── Sell / Edit form ─────────────────────────────────────────
export async function renderSell(editId = null) {
  if (!state.user) { window.openAuth(); return; }
  const editing = !!editId;
  const app     = document.getElementById('app');

  setHtml(app, `
    <div class="max-w-2xl mx-auto px-4 py-6">
      <h1 class="text-3xl font-bold mb-1">${editing ? 'Edit listing' : 'Sell on Xenia'}</h1>
      <p class="text-ink-500 mb-7">${editing ? 'Update your listing.' : 'List a product or service in minutes.'}</p>

      <form id="sellForm" class="space-y-7">

        <!-- Type -->
        <div>
          <label class="block text-sm font-bold mb-3">What are you offering?</label>
          <div class="grid grid-cols-2 gap-3">
            <label class="cursor-pointer">
              <input type="radio" name="type" value="good" class="peer sr-only" ${editing ? '' : 'checked'}>
              <div class="border-2 border-ink-200 peer-checked:border-scarlet-500 peer-checked:bg-scarlet-50 rounded-2xl p-4 text-center transition">
                <p class="font-bold">A good</p>
                <p class="text-xs text-ink-500 mt-0.5">A physical item</p>
              </div>
            </label>
            <label class="cursor-pointer">
              <input type="radio" name="type" value="service" class="peer sr-only">
              <div class="border-2 border-ink-200 peer-checked:border-scarlet-500 peer-checked:bg-scarlet-50 rounded-2xl p-4 text-center transition">
                <p class="font-bold">A service</p>
                <p class="text-xs text-ink-500 mt-0.5">Skills & expertise</p>
              </div>
            </label>
          </div>
        </div>

        <!-- Categories -->
        <div>
          <label class="block text-sm font-bold mb-1">Category</label>
          <p class="text-xs text-ink-400 mb-3">Go as specific as you like — buyers search these.</p>
          <div class="space-y-2">
            <input name="cat1" required placeholder="Main category — e.g. Electronics / Tutoring" class="w-full bg-ink-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-scarlet-200 focus:bg-white outline-none">
            <input name="cat2"          placeholder="Subcategory — e.g. Phone / Math" class="w-full bg-ink-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-scarlet-200 focus:bg-white outline-none">
            <input name="cat3"          placeholder="Tags, comma-separated — e.g. Samsung, Galaxy S22, screen guard" class="w-full bg-ink-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-scarlet-200 focus:bg-white outline-none">
          </div>
        </div>

        <!-- Photos -->
        <div>
          <label class="block text-sm font-bold mb-2">Photos <span class="font-normal text-ink-400">(up to 5 — first is cover)</span></label>
          <div id="photoGrid" class="grid grid-cols-5 gap-2 mb-1">
            <label id="addPhotoLabel" class="aspect-square border-2 border-dashed border-ink-300 rounded-xl flex flex-col items-center justify-center text-ink-400 cursor-pointer hover:border-scarlet-400 hover:text-scarlet-500 transition">
              <svg class="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              <span class="text-[10px]">Add</span>
              <input type="file" accept="image/*" multiple id="photoInput" class="sr-only">
            </label>
          </div>
        </div>

        <!-- Title -->
        <div>
          <label class="block text-sm font-bold mb-2">Title</label>
          <input name="title" required maxlength="80" placeholder="Calculus Textbook 10th Ed., like new"
            class="w-full bg-ink-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-scarlet-200 focus:bg-white outline-none">
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-bold mb-2">Description</label>
          <textarea name="description" required rows="4"
            placeholder="Condition, why you're selling, anything a buyer needs to know…"
            class="w-full bg-ink-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-scarlet-200 focus:bg-white outline-none resize-none"></textarea>
        </div>

        <!-- Price -->
        <div>
          <label class="block text-sm font-bold mb-2">Price</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500 font-bold">$</span>
            <input name="price" type="number" min="0" step="0.01" required placeholder="0"
              class="w-full bg-ink-100 rounded-xl pl-8 pr-20 py-3 text-xl font-bold focus:ring-2 focus:ring-scarlet-200 focus:bg-white outline-none">
            <span id="priceUnit" class="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-400"></span>
          </div>
        </div>

        <button type="submit" id="publishBtn"
          class="w-full bg-scarlet-500 hover:bg-scarlet-600 text-white font-bold py-4 rounded-full text-lg transition disabled:opacity-50">
          ${editing ? 'Save changes' : 'Publish listing'}
        </button>
      </form>
    </div>
  `);

  // ── Photo handling ──
  let photos = [];
  const photoGrid     = document.getElementById('photoGrid');
  const addPhotoLabel = document.getElementById('addPhotoLabel');

  const refreshPhotos = () => {
    [...photoGrid.querySelectorAll('.pt')].forEach(el => el.remove());
    photos.forEach((url, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'pt aspect-square relative rounded-xl overflow-hidden group';
      wrap.innerHTML = `
        <img src="${escapeHtml(url)}" class="w-full h-full object-cover">
        ${i === 0 ? `<span class="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Cover</span>` : ''}
        <button type="button" class="rm absolute top-1 right-1 bg-black/60 hover:bg-scarlet-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm transition opacity-0 group-hover:opacity-100">×</button>`;
      wrap.querySelector('.rm').onclick = () => { photos.splice(i, 1); refreshPhotos(); };
      photoGrid.insertBefore(wrap, addPhotoLabel);
    });
    addPhotoLabel.style.display = photos.length >= 5 ? 'none' : '';
  };

  document.getElementById('photoInput').addEventListener('change', async e => {
    const files = [...e.target.files].slice(0, 5 - photos.length);
    if (!files.length) return;
    const btn = document.getElementById('publishBtn');
    btn.disabled = true; btn.textContent = `Uploading ${files.length} photo${files.length > 1 ? 's' : ''}…`;
    for (const f of files) {
      try { const url = await uploadImage(f); if (url) { photos.push(url); refreshPhotos(); } }
      catch (err) { toast(err.message, 'error'); }
    }
    btn.disabled = false; btn.textContent = editing ? 'Save changes' : 'Publish listing';
    e.target.value = '';
  });

  // ── Price unit label ──
  const updateUnit = () => {
    const type = document.querySelector('input[name="type"]:checked')?.value;
    document.getElementById('priceUnit').textContent = type === 'service' ? '/ hr' : '';
  };
  $$('input[name="type"]').forEach(r => r.addEventListener('change', updateUnit));

  // ── Load existing data when editing ──
  if (editing) {
    try {
      const snap = await getDoc(doc(db, 'listings', editId));
      if (!snap.exists() || snap.data().sellerId !== state.user.uid) {
        toast('Listing not found', 'error'); window.navigate('#my-listings'); return;
      }
      const l = snap.data();
      document.querySelector(`input[name="type"][value="${l.type}"]`).checked = true;
      updateUnit();
      document.querySelector('input[name="cat1"]').value = l.cat1 ?? '';
      document.querySelector('input[name="cat2"]').value = l.cat2 ?? '';
      document.querySelector('input[name="cat3"]').value = (l.cat3 ?? []).join(', ');
      document.querySelector('input[name="title"]').value = l.title ?? '';
      document.querySelector('textarea[name="description"]').value = l.description ?? '';
      document.querySelector('input[name="price"]').value = l.price ?? '';
      photos = [...(l.photos ?? [])];
      refreshPhotos();
    } catch (e) { console.error(e); toast('Failed to load listing', 'error'); }
  }

  // ── Submit ──
  document.getElementById('sellForm').addEventListener('submit', async e => {
    e.preventDefault();
    if (!photos.length) { toast('Add at least one photo', 'error'); return; }
    const btn = document.getElementById('publishBtn');
    btn.disabled = true; btn.textContent = editing ? 'Saving…' : 'Publishing…';

    const fd   = new FormData(e.target);
    const data = {
      type:        fd.get('type'),
      cat1:        fd.get('cat1').trim(),
      cat2:        (fd.get('cat2') ?? '').trim(),
      cat3:        (fd.get('cat3') ?? '').split(',').map(t => t.trim()).filter(Boolean),
      title:       fd.get('title').trim(),
      description: fd.get('description').trim(),
      price:       parseFloat(fd.get('price')),
      photos
    };

    try {
      if (editing) {
        await updateDoc(doc(db, 'listings', editId), data);
        toast('Listing updated!', 'success');
        window.navigate(`#listing/${editId}`);
      } else {
        data.sellerId  = state.user.uid;
        data.sellerName  = state.profile.displayName;
        data.sellerPhoto = state.profile.photoURL ?? null;
        data.status      = 'active';
        data.createdAt   = serverTimestamp();
        const ref = await addDoc(collection(db, 'listings'), data);
        toast('Listing published!', 'success');
        window.navigate(`#listing/${ref.id}`);
      }
    } catch (err) {
      console.error(err);
      toast('Failed to save. Try again.', 'error');
      btn.disabled = false; btn.textContent = editing ? 'Save changes' : 'Publish listing';
    }
  });
}

// ── Actions ─────────────────────────────────────────────────
export async function markSold(id) {
  if (!confirm('Mark this listing as sold?')) return;
  await updateDoc(doc(db, 'listings', id), { status: 'sold' });
  await updateDoc(doc(db, 'users', state.user.uid), { transactionsCompleted: increment(1) });
  toast('Marked as sold!', 'success');
  window.navigate('#my-listings');
}
window.markSold = markSold;

export async function deleteListing(id) {
  if (!confirm('Delete this listing? This cannot be undone.')) return;
  await deleteDoc(doc(db, 'listings', id));
  toast('Listing deleted');
  window.navigate('#my-listings');
}
window.deleteListing = deleteListing;

export async function reportListing(listingId, sellerId) {
  if (!state.user) { window.openAuth(); return; }
  const reason = prompt('Why are you reporting this? (e.g. scam, wrong item, prohibited)');
  if (!reason) return;
  try {
    await addDoc(collection(db, 'reports'), {
      type: 'listing', reporterId: state.user.uid, listingId, reportedId: sellerId, reason,
      createdAt: serverTimestamp()
    });
    toast('Report submitted. Thank you.', 'success');
  } catch (e) { toast('Failed to submit report', 'error'); }
}
window.reportListing = reportListing;

function renderNotFound() {
  setHtml(document.getElementById('app'), `
    <div class="px-4 py-20 text-center">
      <h1 class="text-3xl font-bold mb-2">Not found</h1>
      <p class="text-ink-500 mb-6">That page doesn't exist.</p>
      <a href="#home" class="bg-scarlet-500 text-white px-6 py-3 rounded-full font-semibold">Go home</a>
    </div>`);
}
