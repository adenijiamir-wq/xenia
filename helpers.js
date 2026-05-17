export const $ = (sel) => document.querySelector(sel);
export const $$ = (sel) => [...document.querySelectorAll(sel)];

export function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

export function timeAgo(val) {
  if (!val) return '';
  const d = typeof val === 'number' ? new Date(val) : (val?.toDate ? val.toDate() : new Date(val));
  const secs = Math.floor((Date.now() - d) / 1000);
  if (secs < 60) return 'just now';
  const m = Math.floor(secs / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);    if (h < 24) return `${h}h ago`;
  const dy = Math.floor(h / 24);   if (dy < 7) return `${dy}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function initials(name = '?') {
  return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?';
}

const AV_COLORS = ['bg-scarlet-500','bg-indigo-500','bg-emerald-600','bg-amber-500','bg-purple-500','bg-cyan-600'];
const AV_SIZES  = { xs:'w-6 h-6 text-[10px]', sm:'w-8 h-8 text-xs', md:'w-10 h-10 text-sm', lg:'w-16 h-16 text-xl', xl:'w-24 h-24 text-3xl' };

export function avatarHtml(user, size = 'md') {
  const cls = AV_SIZES[size] || AV_SIZES.md;
  if (user?.photoURL) return `<img src="${escapeHtml(user.photoURL)}" class="${cls} rounded-full object-cover" loading="lazy">`;
  const name = user?.displayName || user?.name || '?';
  const seed = (user?.uid || name).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return `<div class="${cls} ${AV_COLORS[seed % AV_COLORS.length]} rounded-full flex items-center justify-center text-white font-semibold">${initials(name)}</div>`;
}

export function toast(msg, type = 'info') {
  const colors = { info: 'bg-ink-900', success: 'bg-emerald-600', error: 'bg-scarlet-500' };
  const root = document.getElementById('toastRoot');
  const t = document.createElement('div');
  t.className = `${colors[type] || colors.info} text-white px-4 py-2.5 rounded-full shadow-lg text-sm font-medium toast-in pointer-events-auto text-center`;
  t.textContent = msg;
  root.appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity .2s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 200); }, 2800);
}

export function setHtml(el, html) {
  el.innerHTML = html;
  el.classList.remove('fade-in');
  void el.offsetWidth;
  el.classList.add('fade-in');
}

export function showModal(html) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = `<div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 fade-in" id="modalBackdrop"><div class="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto slide-up">${html}</div></div>`;
  document.getElementById('modalBackdrop').addEventListener('click', e => { if (e.target.id === 'modalBackdrop') closeModal(); });
  document.body.style.overflow = 'hidden';
}

export function closeModal() {
  document.getElementById('modalRoot').innerHTML = '';
  document.body.style.overflow = '';
}
window.closeModal = closeModal;

export function skeletonGrid(n = 8) {
  return Array(n).fill(0).map(() => `<div class="rounded-xl overflow-hidden"><div class="skeleton aspect-square rounded-xl"></div><div class="p-2 space-y-1 mt-1"><div class="skeleton h-3.5 rounded w-1/2"></div><div class="skeleton h-3 rounded w-3/4"></div></div></div>`).join('');
}

export function listingCard(l) {
  const photo = l.photos?.[0] || '';
  const price = `$${l.price}${l.type === 'service' ? '<span class="text-xs font-normal text-ink-500">/hr</span>' : ''}`;
  return `<a href="#listing/${l.id}" class="block group">
    <div class="relative aspect-square bg-ink-100 rounded-2xl overflow-hidden mb-2">
      ${photo ? `<img src="${escapeHtml(photo)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy">` : `<div class="w-full h-full flex items-center justify-center text-ink-300"><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>`}
      ${l.type === 'service' ? '<span class="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-xs font-semibold px-2 py-0.5 rounded-full text-indigo-700">Service</span>' : ''}
      ${l.status === 'sold' ? '<div class="absolute inset-0 bg-black/40 flex items-center justify-center"><span class="bg-white text-ink-900 font-bold px-3 py-1 rounded-full text-sm">SOLD</span></div>' : ''}
    </div>
    <div class="px-1">
      <p class="font-bold text-scarlet-500 text-sm">${price}</p>
      <h3 class="font-medium text-sm line-clamp-1">${escapeHtml(l.title)}</h3>
      <div class="flex items-center gap-1.5 mt-0.5">
        ${avatarHtml({ photoURL: l.sellerPhoto, displayName: l.sellerName, uid: l.sellerId }, 'xs')}
        <span class="text-xs text-ink-500 line-clamp-1">${escapeHtml(l.sellerName || '')}</span>
      </div>
    </div>
  </a>`;
}
